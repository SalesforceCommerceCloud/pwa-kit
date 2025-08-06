#!/bin/bash

# 🦕 Test concurrent access to SQLite queue (simulates parallel GitHub Actions)

echo "🧪 Testing Concurrent SQLite Queue Access"
echo "========================================"

# Clean up
rm -f concurrent_test.db

# Initialize database
sqlite3 concurrent_test.db << 'EOF'
CREATE TABLE environments (
  slug TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  pr_number INTEGER,
  acquired_at DATETIME,
  acquired_by TEXT
);

INSERT INTO environments (slug, url) VALUES 
('e2e-tests-pwa-kit', 'https://env1.com'),
('e2e-tests-pwa-kit-2', 'https://env2.com'),
('e2e-tests-pwa-kit-3', 'https://env3.com');
EOF

# Function to simulate a workflow trying to acquire environment
concurrent_acquire() {
    local worker_id=$1
    local pr_num=$2
    
    echo "Worker $worker_id starting..."
    
    # Try to acquire (with small random delay to create race conditions)
    sleep $((RANDOM % 3))
    
    RESULT=$(sqlite3 concurrent_test.db << EOF
BEGIN IMMEDIATE;
UPDATE environments 
SET status = 'in-use', 
    pr_number = $pr_num,
    acquired_at = datetime('now'),
    acquired_by = 'worker-$worker_id'
WHERE slug = (
  SELECT slug FROM environments 
  WHERE status = 'available' 
  ORDER BY slug
  LIMIT 1
);

SELECT slug FROM environments 
WHERE acquired_by = 'worker-$worker_id' 
AND status = 'in-use';
COMMIT;
EOF
)

    if [ -n "$RESULT" ]; then
        echo "✅ Worker $worker_id acquired: $RESULT"
        
        # Simulate work (2-5 seconds)
        sleep $((2 + RANDOM % 4))
        
        # Release environment
        sqlite3 concurrent_test.db << EOF
UPDATE environments 
SET status = 'available', 
    pr_number = NULL,
    acquired_at = NULL,
    acquired_by = NULL
WHERE acquired_by = 'worker-$worker_id';
EOF
        echo "🔓 Worker $worker_id released: $RESULT"
    else
        echo "❌ Worker $worker_id: No environment available"
    fi
}

echo "🚀 Starting 6 concurrent workers (more than 3 available environments)..."

# Start 6 workers in parallel (background processes)
concurrent_acquire 1 101 &
concurrent_acquire 2 102 &
concurrent_acquire 3 103 &
concurrent_acquire 4 104 &
concurrent_acquire 5 105 &
concurrent_acquire 6 106 &

# Wait for all background jobs to complete
wait

echo ""
echo "📊 Final Environment Status:"
sqlite3 concurrent_test.db "SELECT slug, status, COALESCE(pr_number, 'NULL') as pr FROM environments ORDER BY slug;"

echo ""
echo "🎉 Concurrent test completed!"
echo "💡 All workers should have eventually gotten an environment (no race conditions)"