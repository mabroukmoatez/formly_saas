<?php
/**
 * Database Import Script
 * 
 * This script imports the base.sql database dump file
 * Run this script AFTER configuring your .env file
 * 
 * Usage: php install_database.php
 * Or access via browser: http://localhost/form.fr/install_database.php
 */

// Set execution time and memory limit
set_time_limit(0);
ini_set('memory_limit', '512M');

// Color codes for CLI output
class Color {
    public static $RED = "\033[31m";
    public static $GREEN = "\033[32m";
    public static $YELLOW = "\033[33m";
    public static $BLUE = "\033[34m";
    public static $RESET = "\033[0m";
}

// Check if running from CLI or browser
$isCLI = php_sapi_name() === 'cli';

function output($message, $color = null, $isCLI = true) {
    if ($isCLI) {
        if ($color) {
            echo $color . $message . Color::$RESET . PHP_EOL;
        } else {
            echo $message . PHP_EOL;
        }
    } else {
        $style = '';
        if ($color === Color::$RED) $style = 'color: red;';
        if ($color === Color::$GREEN) $style = 'color: green;';
        if ($color === Color::$YELLOW) $style = 'color: orange;';
        if ($color === Color::$BLUE) $style = 'color: blue;';
        
        echo "<p style='$style'>" . htmlspecialchars($message) . "</p>";
    }
}

// Start output
if (!$isCLI) {
    echo "<!DOCTYPE html>
<html>
<head>
    <title>Database Import</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        .log { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
<h1>📦 Database Import Script</h1>
<div class='log'>";
}

output("===========================================", Color::$BLUE, $isCLI);
output("   DATABASE IMPORT SCRIPT", Color::$BLUE, $isCLI);
output("===========================================", Color::$BLUE, $isCLI);
output("", null, $isCLI);

// Step 1: Check if base.sql exists
output("🔍 Step 1: Checking for base.sql file...", Color::$YELLOW, $isCLI);

$sqlFile = __DIR__ . '/base.sql';
if (!file_exists($sqlFile)) {
    output("❌ ERROR: base.sql file not found!", Color::$RED, $isCLI);
    output("   Please ensure base.sql is in the project root directory.", null, $isCLI);
    exit(1);
}

$fileSize = filesize($sqlFile);
$fileSizeMB = round($fileSize / 1024 / 1024, 2);
output("✅ Found base.sql (" . $fileSizeMB . " MB)", Color::$GREEN, $isCLI);
output("", null, $isCLI);

// Step 2: Load .env configuration
output("🔍 Step 2: Loading database configuration...", Color::$YELLOW, $isCLI);

$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    output("❌ ERROR: .env file not found!", Color::$RED, $isCLI);
    output("   Please copy .env.example to .env and configure it first.", null, $isCLI);
    exit(1);
}

// Parse .env file
$envContent = file_get_contents($envFile);
preg_match('/DB_HOST=(.*)/', $envContent, $hostMatch);
preg_match('/DB_DATABASE=(.*)/', $envContent, $dbMatch);
preg_match('/DB_USERNAME=(.*)/', $envContent, $userMatch);
preg_match('/DB_PASSWORD=(.*)/', $envContent, $passMatch);

$dbHost = isset($hostMatch[1]) ? trim($hostMatch[1]) : 'localhost';
$dbName = isset($dbMatch[1]) ? trim($dbMatch[1]) : '';
$dbUser = isset($userMatch[1]) ? trim($userMatch[1]) : 'root';
$dbPass = isset($passMatch[1]) ? trim($passMatch[1]) : '';

if (empty($dbName)) {
    output("❌ ERROR: DB_DATABASE not configured in .env", Color::$RED, $isCLI);
    exit(1);
}

output("   Host: " . $dbHost, null, $isCLI);
output("   Database: " . $dbName, null, $isCLI);
output("   User: " . $dbUser, null, $isCLI);
output("✅ Configuration loaded", Color::$GREEN, $isCLI);
output("", null, $isCLI);

// Step 3: Connect to MySQL
output("🔍 Step 3: Connecting to MySQL...", Color::$YELLOW, $isCLI);

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]
    );
    output("✅ Connected to MySQL server", Color::$GREEN, $isCLI);
} catch (PDOException $e) {
    output("❌ ERROR: Cannot connect to MySQL", Color::$RED, $isCLI);
    output("   " . $e->getMessage(), Color::$RED, $isCLI);
    exit(1);
}

output("", null, $isCLI);

// Step 4: Create database if not exists
output("🔍 Step 4: Creating database if not exists...", Color::$YELLOW, $isCLI);

try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbName`");
    output("✅ Database '$dbName' is ready", Color::$GREEN, $isCLI);
} catch (PDOException $e) {
    output("❌ ERROR: Cannot create database", Color::$RED, $isCLI);
    output("   " . $e->getMessage(), Color::$RED, $isCLI);
    exit(1);
}

output("", null, $isCLI);

// Step 5: Disable foreign key checks
output("🔍 Step 5: Preparing database...", Color::$YELLOW, $isCLI);

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO'");
    $pdo->exec("SET time_zone = '+00:00'");
    output("✅ Database prepared for import", Color::$GREEN, $isCLI);
} catch (PDOException $e) {
    output("⚠️  Warning: " . $e->getMessage(), Color::$YELLOW, $isCLI);
}

output("", null, $isCLI);

// Step 6: Import SQL file
output("🔍 Step 6: Importing database (this may take a while)...", Color::$YELLOW, $isCLI);
output("   File size: " . $fileSizeMB . " MB", null, $isCLI);

$startTime = microtime(true);

try {
    // Read SQL file
    $sql = file_get_contents($sqlFile);
    
    // Split SQL into individual statements
    // Handle multi-line statements and comments
    $statements = [];
    $buffer = '';
    $inDelimiter = false;
    
    $lines = explode("\n", $sql);
    $lineCount = count($lines);
    $processedLines = 0;
    
    foreach ($lines as $line) {
        $processedLines++;
        
        // Show progress every 1000 lines
        if ($processedLines % 1000 === 0) {
            $percent = round(($processedLines / $lineCount) * 100);
            output("   Processing... " . $percent . "% (" . $processedLines . "/" . $lineCount . " lines)", null, $isCLI);
        }
        
        $line = trim($line);
        
        // Skip comments and empty lines
        if (empty($line) || substr($line, 0, 2) === '--' || substr($line, 0, 1) === '#') {
            continue;
        }
        
        // Check for delimiter change
        if (stripos($line, 'DELIMITER') === 0) {
            $inDelimiter = !$inDelimiter;
            continue;
        }
        
        $buffer .= $line . "\n";
        
        // Check for statement end
        if (!$inDelimiter && substr($line, -1) === ';') {
            $statements[] = $buffer;
            $buffer = '';
        }
    }
    
    // Add last statement if any
    if (!empty(trim($buffer))) {
        $statements[] = $buffer;
    }
    
    output("   Found " . count($statements) . " SQL statements", null, $isCLI);
    output("", null, $isCLI);
    output("   Executing statements...", Color::$YELLOW, $isCLI);
    
    // Execute statements
    $executed = 0;
    $failed = 0;
    
    foreach ($statements as $index => $statement) {
        try {
            $statement = trim($statement);
            if (!empty($statement)) {
                $pdo->exec($statement);
                $executed++;
                
                // Show progress every 100 statements
                if ($executed % 100 === 0) {
                    $percent = round(($executed / count($statements)) * 100);
                    output("   Executed: " . $percent . "% (" . $executed . "/" . count($statements) . ")", null, $isCLI);
                }
            }
        } catch (PDOException $e) {
            $failed++;
            if ($failed <= 5) { // Only show first 5 errors
                output("   ⚠️  Statement " . ($index + 1) . " failed: " . $e->getMessage(), Color::$YELLOW, $isCLI);
            }
        }
    }
    
    $endTime = microtime(true);
    $duration = round($endTime - $startTime, 2);
    
    output("", null, $isCLI);
    output("✅ Import completed in " . $duration . " seconds", Color::$GREEN, $isCLI);
    output("   Executed: " . $executed . " statements", Color::$GREEN, $isCLI);
    if ($failed > 0) {
        output("   Failed: " . $failed . " statements", Color::$YELLOW, $isCLI);
    }
    
} catch (Exception $e) {
    output("❌ ERROR during import: " . $e->getMessage(), Color::$RED, $isCLI);
    exit(1);
}

output("", null, $isCLI);

// Step 7: Re-enable foreign key checks
output("🔍 Step 7: Finalizing...", Color::$YELLOW, $isCLI);

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    output("✅ Foreign key checks re-enabled", Color::$GREEN, $isCLI);
} catch (PDOException $e) {
    output("⚠️  Warning: " . $e->getMessage(), Color::$YELLOW, $isCLI);
}

output("", null, $isCLI);

// Step 8: Verify import
output("🔍 Step 8: Verifying import...", Color::$YELLOW, $isCLI);

try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $tableCount = count($tables);
    
    output("✅ Found " . $tableCount . " tables in database", Color::$GREEN, $isCLI);
    
    if ($tableCount > 0) {
        output("", null, $isCLI);
        output("📊 Sample tables:", null, $isCLI);
        $sampleTables = array_slice($tables, 0, 10);
        foreach ($sampleTables as $table) {
            output("   - " . $table, null, $isCLI);
        }
        if ($tableCount > 10) {
            output("   ... and " . ($tableCount - 10) . " more tables", null, $isCLI);
        }
    }
} catch (PDOException $e) {
    output("⚠️  Could not verify tables: " . $e->getMessage(), Color::$YELLOW, $isCLI);
}

output("", null, $isCLI);
output("===========================================", Color::$BLUE, $isCLI);
output("   🎉 DATABASE IMPORT COMPLETE!", Color::$GREEN, $isCLI);
output("===========================================", Color::$BLUE, $isCLI);
output("", null, $isCLI);
output("Next steps:", Color::$YELLOW, $isCLI);
output("1. Run: php artisan migrate (if you have new migrations)", null, $isCLI);
output("2. Run: php artisan key:generate (if not done)", null, $isCLI);
output("3. Run: php artisan storage:link", null, $isCLI);
output("4. Run: php artisan config:cache", null, $isCLI);
output("5. Access your application at: http://localhost/form.fr", null, $isCLI);

if (!$isCLI) {
    echo "</div>
    <p><strong>✅ Import completed successfully!</strong></p>
    <p><a href='/form.fr'>Go to Application</a></p>
    </body>
    </html>";
}

