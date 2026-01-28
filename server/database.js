import "dotenv/config";
import pg from 'pg';
const { Pool } = pg;

// Database connection pool
let pool = null;

// Initialize database connection
export function initDatabase() {
  const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

  if (!connectionString) {
    console.warn('⚠️  No DATABASE_URL found. Projects will not persist!');
    return null;
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('✅ PostgreSQL connection pool created');
  return pool;
}

// Create projects table if it doesn't exist
export async function createProjectsTable() {
  if (!pool) {
    console.warn('⚠️  Database not initialized');
    return false;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        year VARCHAR(50),
        category VARCHAR(100),
        image TEXT,
        video TEXT,
        type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Projects table ready');
    return true;
  } catch (error) {
    console.error('❌ Error creating projects table:', error);
    return false;
  }
}

// Get all projects
export async function getAllProjects() {
  if (!pool) {
    console.warn('⚠️  Database not initialized, returning empty array');
    return [];
  }

  try {
    const result = await pool.query(
      'SELECT id, title, description, year, category, image, video, type FROM projects ORDER BY id DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    return [];
  }
}

// Save projects (replace all)
export async function saveAllProjects(projects) {
  if (!pool) {
    console.warn('⚠️  Database not initialized');
    return false;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete all existing projects
    await client.query('DELETE FROM projects');

    // Insert new projects
    for (const project of projects) {
      await client.query(
        `INSERT INTO projects (id, title, description, year, category, image, video, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          project.id,
          project.title,
          project.description || '',
          project.year || '',
          project.category || '',
          project.image || null,
          project.video || null,
          project.type || 'image'
        ]
      );
    }

    // Reset sequence to max id
    if (projects.length > 0) {
      const maxId = Math.max(...projects.map(p => p.id));
      await client.query(`SELECT setval('projects_id_seq', $1)`, [maxId]);
    }

    await client.query('COMMIT');
    console.log(`✅ Saved ${projects.length} projects to database`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error saving projects:', error);
    return false;
  } finally {
    client.release();
  }
}

// Add a single project
export async function addProject(project) {
  if (!pool) {
    console.warn('⚠️  Database not initialized');
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO projects (title, description, year, category, image, video, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        project.title,
        project.description || '',
        project.year || '',
        project.category || '',
        project.image || null,
        project.video || null,
        project.type || 'image'
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error adding project:', error);
    return null;
  }
}

// Update a project
export async function updateProject(id, project) {
  if (!pool) {
    console.warn('⚠️  Database not initialized');
    return false;
  }

  try {
    await pool.query(
      `UPDATE projects
       SET title = $1, description = $2, year = $3, category = $4,
           image = $5, video = $6, type = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        project.title,
        project.description || '',
        project.year || '',
        project.category || '',
        project.image || null,
        project.video || null,
        project.type || 'image',
        id
      ]
    );
    return true;
  } catch (error) {
    console.error('❌ Error updating project:', error);
    return false;
  }
}

// Delete a project
export async function deleteProject(id) {
  if (!pool) {
    console.warn('⚠️  Database not initialized');
    return false;
  }

  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return true;
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    return false;
  }
}

// Close database connection
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection closed');
  }
}
