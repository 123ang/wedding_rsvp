#!/usr/bin/env python3
"""
Export Supabase (PostgreSQL) Database to MySQL Format

This script connects to Supabase PostgreSQL database and exports data
to MySQL-compatible SQL INSERT statements.

Usage:
    python export_supabase_to_mysql.py

Requirements:
    pip install psycopg2-binary python-dotenv
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables
load_dotenv()

# Supabase connection settings (will be set in main())
SUPABASE_HOST = os.getenv('SUPABASE_DB_HOST', 'db.gixbazstflmpsjksstjc.supabase.co')
SUPABASE_PORT = os.getenv('SUPABASE_DB_PORT', '5432')
SUPABASE_DB = os.getenv('SUPABASE_DB_NAME', 'postgres')
SUPABASE_USER = os.getenv('SUPABASE_DB_USER', 'postgres')
SUPABASE_PASSWORD = os.getenv('SUPABASE_DB_PASSWORD', '')

# Output file
OUTPUT_FILE = 'supabase_export.sql'
MYSQL_DB_NAME = 'wedding_rsvp'


def escape_sql_string(value):
    """Escape string for SQL INSERT statement"""
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return '1' if value else '0'
    if isinstance(value, (int, float)):
        return str(value)
    # Escape single quotes and backslashes
    escaped = str(value).replace('\\', '\\\\').replace("'", "\\'")
    return f"'{escaped}'"


def format_value_for_mysql(value, column_type):
    """Format value based on MySQL column type"""
    if value is None:
        return 'NULL'
    
    # Handle boolean types
    if column_type in ('boolean', 'bool'):
        return '1' if value else '0'
    
    # Handle numeric types
    if column_type in ('integer', 'bigint', 'smallint', 'numeric', 'decimal', 'real', 'double precision'):
        return str(value)
    
    # Handle timestamp types
    if column_type in ('timestamp', 'timestamp without time zone', 'timestamp with time zone', 'date', 'time'):
        if isinstance(value, datetime):
            return f"'{value.strftime('%Y-%m-%d %H:%M:%S')}'"
        return escape_sql_string(value)
    
    # Handle string types (default)
    return escape_sql_string(value)


def get_table_columns(cursor, table_name):
    """Get column information for a table"""
    query = """
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = %s
        ORDER BY ordinal_position;
    """
    cursor.execute(query, (table_name,))
    return cursor.fetchall()


def export_table(cursor, table_name, mysql_table_name=None):
    """Export a table's data to MySQL INSERT statements"""
    if mysql_table_name is None:
        mysql_table_name = table_name
    
    print(f"Exporting table: {table_name} -> {mysql_table_name}")
    
    # Get column information
    columns = get_table_columns(cursor, table_name)
    if not columns:
        print(f"  Warning: Table {table_name} not found or has no columns")
        return []
    
    column_names = [col['column_name'] for col in columns]
    column_types = {col['column_name']: col['data_type'] for col in columns}
    
    # Fetch all data
    query = f'SELECT * FROM "{table_name}" ORDER BY id'
    cursor.execute(query)
    rows = cursor.fetchall()
    
    if not rows:
        print(f"  No data found in {table_name}")
        return []
    
    # Generate INSERT statements
    insert_statements = []
    insert_statements.append(f"\n-- Export from {table_name} ({len(rows)} rows)")
    insert_statements.append(f"-- Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Use INSERT IGNORE to handle duplicates
    columns_str = ', '.join(column_names)
    insert_statements.append(f"INSERT IGNORE INTO `{mysql_table_name}` ({columns_str}) VALUES")
    
    values_list = []
    for row in rows:
        values = []
        for col_name in column_names:
            value = row[col_name]
            col_type = column_types.get(col_name, 'text')
            formatted_value = format_value_for_mysql(value, col_type)
            values.append(formatted_value)
        values_list.append(f"({', '.join(values)})")
    
    # Combine all values
    insert_statements.append(',\n'.join(values_list))
    insert_statements.append(';\n')
    
    print(f"  Exported {len(rows)} rows")
    return insert_statements


def connect_to_supabase(password=None):
    """Connect to Supabase PostgreSQL database"""
    if password is None:
        password = SUPABASE_PASSWORD
    try:
        print("Connecting to Supabase...")
        print(f"  Host: {SUPABASE_HOST}")
        print(f"  Database: {SUPABASE_DB}")
        print(f"  User: {SUPABASE_USER}")
        
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            port=SUPABASE_PORT,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=password
        )
        print("[OK] Connected successfully!\n")
        return conn
    except psycopg2.Error as e:
        print(f"[ERROR] Connection failed: {e}")
        print("\nPlease check your Supabase database credentials.")
        print("Make sure:")
        print("  - Password is correct")
        print("  - Your IP is allowed in Supabase (Settings -> Database -> Connection pooling)")
        sys.exit(1)


def main():
    """Main export function"""
    print("=" * 60)
    print("Supabase to MySQL Export Script")
    print("=" * 60)
    print()
    
    # Check if password is set, prompt if not
    if not SUPABASE_PASSWORD:
        print("[!] Error: SUPABASE_DB_PASSWORD not set in .env file")
        print("\nYou need to provide your Supabase database password.")
        print("\nTo get your password:")
        print("  1. Go to https://app.supabase.com")
        print("  2. Select your project")
        print("  3. Settings -> Database -> Connection string")
        print("  4. Copy the password from the connection string")
        print("\nYou can either:")
        print("  A) Create a .env file with SUPABASE_DB_PASSWORD=your_password")
        print("  B) Enter it now (will not be saved):")
        
        try:
            import getpass
            password = getpass.getpass("\nEnter Supabase database password: ")
            if password:
                print("Password entered. Connecting...\n")
            else:
                print("\n[!] No password provided. Exiting.")
                sys.exit(1)
        except KeyboardInterrupt:
            print("\n\n[!] Cancelled by user.")
            sys.exit(1)
        except Exception as e:
            print(f"\n[!] Error reading password: {e}")
            print("\nPlease create a .env file with your Supabase database credentials:")
            print("  SUPABASE_DB_HOST=db.xxxxx.supabase.co")
            print("  SUPABASE_DB_PORT=5432")
            print("  SUPABASE_DB_NAME=postgres")
            print("  SUPABASE_DB_USER=postgres")
            print("  SUPABASE_DB_PASSWORD=your_password_here")
            sys.exit(1)
    else:
        password = SUPABASE_PASSWORD
    
    # Connect to database
    conn = connect_to_supabase(password)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Start building SQL file
        sql_content = []
        sql_content.append("-- MySQL Export from Supabase")
        sql_content.append(f"-- Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        sql_content.append(f"-- Database: {SUPABASE_DB} -> {MYSQL_DB_NAME}\n")
        sql_content.append(f"USE `{MYSQL_DB_NAME}`;\n")
        sql_content.append("SET FOREIGN_KEY_CHECKS = 0;\n")
        sql_content.append("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n")
        sql_content.append("SET time_zone = '+00:00';\n\n")
        
        # Export tables
        tables_to_export = [
            ('admin_users', 'admin_users'),
            ('rsvps', 'rsvps'),
        ]
        
        for supabase_table, mysql_table in tables_to_export:
            try:
                statements = export_table(cursor, supabase_table, mysql_table)
                sql_content.extend(statements)
                sql_content.append("\n")
            except Exception as e:
                print(f"  [ERROR] Error exporting {supabase_table}: {e}")
                continue
        
        sql_content.append("SET FOREIGN_KEY_CHECKS = 1;\n")
        sql_content.append("-- Export completed!\n")
        
        # Write to file
        output_path = os.path.join(os.path.dirname(__file__), OUTPUT_FILE)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sql_content))
        
        print()
        print("=" * 60)
        print(f"[SUCCESS] Export completed successfully!")
        print(f"  Output file: {output_path}")
        print("=" * 60)
        print()
        print("Next steps:")
        print(f"  1. Review the SQL file: {OUTPUT_FILE}")
        print(f"  2. Import into MySQL: mysql -u username -p {MYSQL_DB_NAME} < {OUTPUT_FILE}")
        print("  3. Or import via phpMyAdmin/MySQL Workbench")
        
    except Exception as e:
        print(f"[ERROR] Export failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        cursor.close()
        conn.close()
        print("\n[OK] Database connection closed")


if __name__ == '__main__':
    main()

