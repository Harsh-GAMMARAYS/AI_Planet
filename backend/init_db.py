#!/usr/bin/env python3
"""
Simple database initialization script
"""
from models.database import create_tables
from dotenv import load_dotenv
import os

load_dotenv()

def main():
    print("🚀 Initializing database...")
    
    # Check if DATABASE_URL is set
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        print("Please copy env.example to .env and update the DATABASE_URL")
        return
    
    try:
        # Create tables
        create_tables()
        print("✅ Database tables created successfully!")
        print("🎉 Database initialization complete!")
        
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")
        print("Make sure PostgreSQL is running and accessible")

if __name__ == "__main__":
    main()
