#!/bin/bash

# 🦕 Test script for SQLite environment queue
# Simulates multiple GitHub Actions workflows competing for environments

echo "🧪 Testing SQLite Environment Queue"
echo "=================================="

# Clean up any existing test database
rm -f test_env_queue.db

# Function to simulate a workflow acquiring an environment
simulate_workflow() {
    local workflow_id=$1
    local pr_number=$2
    
    echo "🔄 Workflow $workflow_id (PR $pr_number) attempting to acquire environment..."
    
    # Create/setup database (same as in GitHub Actions)
    sqlite3 test_env_queue.db << 'EOF'
CREATE TABLE IF NOT EXISTS environments (
  slug TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  pr_number INTEGER,
  acquired_at DATETIME,
  acquired_by TEXT
);

-- Insert available MRT environments (same as workflow)
INSERT OR IGNORE INTO environments (slug, url) VALUES 
('e2e-tests-pwa-kit', 'https://scaffold-pwa-e2e-tests-pwa-kit.mobify-storefront.com'),
('e2e-tests-pwa-kit-2', 'https://scaffold-pwa-e2e-tests-pwa-kit-2.mobify-storefront.com'),
('e2e-tests-pwa-kit-3', 'https://scaffold-pwa-e2e-tests-pwa-kit-3.mobify-storefront.com');
EOF

    # Try to acquire environment (same logic as workflow)
    RESULT=$(sqlite3 test_env_queue.db << EOF
BEGIN IMMEDIATE;
UPDATE environments 
SET status = 'in-use', 
    pr_number = $pr_number,
    acquired_at = datetime('now'),
    acquired_by = 'workflow-$workflow_id'
WHERE slug = (
  SELECT slug FROM environments 
  WHERE status = 'available' 
  ORDER BY slug
  LIMIT 1
);

SELECT slug || '|' || url FROM environments 
WHERE acquired_by = 'workflow-$workflow_id' 
AND status = 'in-use';
COMMIT;
EOF
)

    if [ -n "$RESULT" ]; then
        ENV_SLUG=$(echo "$RESULT" | cut -d'|' -f1)
        ENV_URL=$(echo "$RESULT" | cut -d'|' -f2)
        echo "✅ Workflow $workflow_id acquired: $ENV_SLUG"
        echo "   URL: $ENV_URL"
        return 0
    else
        echo "❌ Workflow $workflow_id: No environments available"
        return 1
    fi
}

# Function to release an environment
release_environment() {
    local workflow_id=$1
    
    echo "🔓 Workflow $workflow_id releasing environment..."
    
    sqlite3 test_env_queue.db << EOF
UPDATE environments 
SET status = 'available', 
    pr_number = NULL,
    acquired_at = NULL,
    acquired_by = NULL
WHERE acquired_by = 'workflow-$workflow_id';
EOF
    
    echo "✅ Workflow $workflow_id released environment"
}

# Function to show current environment status
show_status() {
    echo "📊 Current Environment Status:"
    echo "Slug | Status | PR | Acquired By | Acquired At"
    echo "------------------------------------------------"
    sqlite3 test_env_queue.db "SELECT slug, status, COALESCE(pr_number, 'NULL'), COALESCE(acquired_by, 'NULL'), COALESCE(acquired_at, 'NULL') FROM environments ORDER BY slug;" | sed 's/|/ | /g'
    echo ""
}

# Test Scenario 1: Sequential acquisition
echo "🧪 Test 1: Sequential Acquisition"
echo "--------------------------------"
simulate_workflow 1 101
simulate_workflow 2 102  
simulate_workflow 3 103
show_status

echo "🧪 Test 2: Try to acquire 4th environment (should fail)"
echo "------------------------------------------------------"
simulate_workflow 4 104
show_status

echo "🧪 Test 3: Release one environment and try again"
echo "-----------------------------------------------"
release_environment 1
show_status
simulate_workflow 4 104
show_status

echo "🧪 Test 4: Release all environments"
echo "----------------------------------"
release_environment 2
release_environment 3
release_environment 4
show_status

echo "🎉 Test completed! Check the results above."
echo "💡 If you see proper acquisition/release behavior, the queue works!"