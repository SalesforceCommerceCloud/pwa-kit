#!/bin/bash

# 🦕 Interactive SQLite Queue Tester
# Lets you manually test acquire/release operations

DB_FILE="interactive_test.db"

# Initialize database
init_db() {
    echo "🔧 Initializing database..."
    sqlite3 $DB_FILE << 'EOF'
CREATE TABLE IF NOT EXISTS environments (
  slug TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  pr_number INTEGER,
  acquired_at DATETIME,
  acquired_by TEXT
);

DELETE FROM environments; -- Clear existing data

INSERT INTO environments (slug, url) VALUES 
('e2e-tests-pwa-kit', 'https://scaffold-pwa-e2e-tests-pwa-kit.mobify-storefront.com'),
('e2e-tests-pwa-kit-2', 'https://scaffold-pwa-e2e-tests-pwa-kit-2.mobify-storefront.com'),
('e2e-tests-pwa-kit-3', 'https://scaffold-pwa-e2e-tests-pwa-kit-3.mobify-storefront.com');
EOF
    echo "✅ Database initialized with 3 environments"
}

# Show current status
show_status() {
    echo ""
    echo "📊 Current Environment Status:"
    echo "=============================="
    printf "%-20s %-10s %-6s %-12s %s\n" "Slug" "Status" "PR" "Acquired By" "Acquired At"
    echo "------------------------------------------------------------------------"
    sqlite3 $DB_FILE "SELECT 
        slug, 
        status, 
        COALESCE(pr_number, 'NULL'), 
        COALESCE(acquired_by, 'NULL'), 
        COALESCE(acquired_at, 'NULL') 
    FROM environments ORDER BY slug;" | while IFS='|' read slug status pr acquired_by acquired_at; do
        printf "%-20s %-10s %-6s %-12s %s\n" "$slug" "$status" "$pr" "$acquired_by" "$acquired_at"
    done
    echo ""
}

# Acquire environment
acquire_env() {
    local pr_num=$1
    local worker_id=$2
    
    if [ -z "$pr_num" ] || [ -z "$worker_id" ]; then
        echo "Usage: acquire <pr_number> <worker_id>"
        return 1
    fi
    
    echo "🔄 Attempting to acquire environment for PR $pr_num (worker $worker_id)..."
    
    RESULT=$(sqlite3 $DB_FILE << EOF
BEGIN IMMEDIATE;
UPDATE environments 
SET status = 'in-use', 
    pr_number = $pr_num,
    acquired_at = datetime('now'),
    acquired_by = '$worker_id'
WHERE slug = (
  SELECT slug FROM environments 
  WHERE status = 'available' 
  ORDER BY slug
  LIMIT 1
);

SELECT slug || '|' || url FROM environments 
WHERE acquired_by = '$worker_id' 
AND status = 'in-use';
COMMIT;
EOF
)

    if [ -n "$RESULT" ]; then
        ENV_SLUG=$(echo "$RESULT" | cut -d'|' -f1)
        ENV_URL=$(echo "$RESULT" | cut -d'|' -f2)
        echo "✅ Acquired: $ENV_SLUG"
        echo "   URL: $ENV_URL"
    else
        echo "❌ No environments available"
    fi
}

# Release environment
release_env() {
    local worker_id=$1
    
    if [ -z "$worker_id" ]; then
        echo "Usage: release <worker_id>"
        return 1
    fi
    
    echo "🔓 Releasing environment for worker $worker_id..."
    
    RELEASED=$(sqlite3 $DB_FILE << EOF
SELECT slug FROM environments WHERE acquired_by = '$worker_id';
UPDATE environments 
SET status = 'available', 
    pr_number = NULL,
    acquired_at = NULL,
    acquired_by = NULL
WHERE acquired_by = '$worker_id';
EOF
)

    if [ -n "$RELEASED" ]; then
        echo "✅ Released: $RELEASED"
    else
        echo "❌ No environment found for worker $worker_id"
    fi
}

# Main interactive loop
main() {
    echo "🦕 Interactive SQLite Queue Tester"
    echo "=================================="
    echo "Commands:"
    echo "  init                    - Initialize/reset database"
    echo "  status                  - Show current environment status"
    echo "  acquire <pr> <worker>   - Acquire environment (e.g., acquire 123 worker-1)"
    echo "  release <worker>        - Release environment (e.g., release worker-1)"
    echo "  quit                    - Exit"
    echo ""
    
    init_db
    show_status
    
    while true; do
        echo -n "🦕 > "
        read -r command arg1 arg2
        
        case $command in
            "init")
                init_db
                show_status
                ;;
            "status")
                show_status
                ;;
            "acquire")
                acquire_env "$arg1" "$arg2"
                show_status
                ;;
            "release")
                release_env "$arg1"
                show_status
                ;;
            "quit"|"exit"|"q")
                echo "👋 Goodbye!"
                break
                ;;
            "")
                continue
                ;;
            *)
                echo "❌ Unknown command: $command"
                echo "Available: init, status, acquire <pr> <worker>, release <worker>, quit"
                ;;
        esac
    done
}

# Run if called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi