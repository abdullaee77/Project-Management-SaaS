-- ============================================
-- USERS
-- Stores everyone who signs up for Taskly
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id                VARCHAR(255) PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password          VARCHAR(255),
  avatar            VARCHAR(500),
  is_verified       BOOLEAN DEFAULT FALSE,
  verify_token      VARCHAR(255),
  verify_token_expiry TIMESTAMP,
  reset_token       VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- WORKSPACES
-- A workspace is like a company or team space
-- One user can have multiple workspaces
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
  id            VARCHAR(255) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) UNIQUE NOT NULL,
  logo          VARCHAR(500),
  owner_id      VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan          VARCHAR(50) DEFAULT 'free',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- WORKSPACE MEMBERS
-- Connects users to workspaces with a role
-- One row = one user in one workspace
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id            VARCHAR(255) PRIMARY KEY,
  workspace_id  VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================
-- INVITATIONS
-- When someone is invited to a workspace
-- A token is generated and sent via email
-- ============================================
CREATE TABLE IF NOT EXISTS invitations (
  id            VARCHAR(255) PRIMARY KEY,
  workspace_id  VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_by    VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'member',
  token         VARCHAR(255) UNIQUE NOT NULL,
  status        VARCHAR(50) DEFAULT 'pending',
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);



-- ============================================
-- PROJECTS
-- Projects live inside workspaces
-- A workspace can have many projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id            VARCHAR(255) PRIMARY KEY,
  workspace_id  VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  color         VARCHAR(50) DEFAULT '#6366f1',
  status        VARCHAR(50) DEFAULT 'active',
  created_by    VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TASKS
-- Tasks live inside projects
-- This is the core of Taskly
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id            VARCHAR(255) PRIMARY KEY,
  project_id    VARCHAR(255) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id  VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  status        VARCHAR(50) DEFAULT 'todo',
  priority      VARCHAR(50) DEFAULT 'medium',
  position      INTEGER DEFAULT 0,
  due_date      TIMESTAMP,
  assignee_id   VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_by    VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TASK LABELS
-- Tags attached to tasks like "bug", "feature"
-- ============================================
CREATE TABLE IF NOT EXISTS labels (
  id            VARCHAR(255) PRIMARY KEY,
  workspace_id  VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  color         VARCHAR(50) DEFAULT '#6366f1',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_labels (
  task_id       VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id      VARCHAR(255) NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- ============================================
-- SUBTASKS
-- Checklist items inside a task
-- ============================================
CREATE TABLE IF NOT EXISTS subtasks (
  id            VARCHAR(255) PRIMARY KEY,
  task_id       VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title         VARCHAR(500) NOT NULL,
  is_completed  BOOLEAN DEFAULT FALSE,
  position      INTEGER DEFAULT 0,
  created_by    VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TASK COMMENTS
-- Comments left by team members on a task
-- ============================================
CREATE TABLE IF NOT EXISTS task_comments (
  id            VARCHAR(255) PRIMARY KEY,
  task_id       VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id       VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TASK ATTACHMENTS
-- Files uploaded and attached to a task
-- ============================================
CREATE TABLE IF NOT EXISTS task_attachments (
  id            VARCHAR(255) PRIMARY KEY,
  task_id       VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by   VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name     VARCHAR(255) NOT NULL,
  file_url      VARCHAR(500) NOT NULL,
  file_type     VARCHAR(100),
  file_size     INTEGER,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TASK ACTIVITY
-- Log of everything that happens on a task
-- Who changed what and when
-- ============================================
CREATE TABLE IF NOT EXISTS task_activity (
  id            VARCHAR(255) PRIMARY KEY,
  task_id       VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id       VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        VARCHAR(255) NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- In app notifications for each user
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id            VARCHAR(255) PRIMARY KEY,
  user_id       VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id  VARCHAR(255) REFERENCES workspaces(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  message       TEXT NOT NULL,
  type          VARCHAR(100) NOT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  link          VARCHAR(500),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS
-- Stripe subscription data for each workspace
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    VARCHAR(255) PRIMARY KEY,
  workspace_id          VARCHAR(255) UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id    VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan                  VARCHAR(50) DEFAULT 'free',
  status                VARCHAR(50) DEFAULT 'active',
  current_period_start  TIMESTAMP,
  current_period_end    TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- Makes database queries faster
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);