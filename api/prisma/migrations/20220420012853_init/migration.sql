CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "config" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invitation_code" VARCHAR,
    "disable_signup" BOOLEAN NOT NULL DEFAULT false,
    "allow_server_storage_use" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pk_af2ddc24176f1572cbdd4b45992" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,
    "type" VARCHAR,
    "message_id" VARCHAR,
    "mime_type" VARCHAR,
    "size" BIGINT,
    "uploaded_at" TIMESTAMPTZ(6),
    "upload_progress" DOUBLE PRECISION,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "sharing_options" VARCHAR[],
    "signed_key" VARCHAR,
    "file_id" VARCHAR,
    "link_id" UUID,
    "forward_info" VARCHAR,

    CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(255) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "expire" BIGINT,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "usages" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" VARCHAR NOT NULL,
    "usage" BIGINT NOT NULL,
    "expire" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_7d8e95b6dd4c0e87cad4972da13" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "users" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" VARCHAR NOT NULL,
    "name" VARCHAR,
    "email" VARCHAR,
    "tg_id" VARCHAR,
    "plan" VARCHAR,
    "settings" JSONB,
    "role" VARCHAR,

    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitings" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR NOT NULL,

    CONSTRAINT "PK_f0cfe98441cf0fb92db66ae71c4" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_link_id_idx" ON "files"("link_id");

-- CreateIndex
CREATE INDEX "files_message_id_idx" ON "files"("message_id");

-- CreateIndex
CREATE INDEX "files_parent_id_idx" ON "files"("parent_id");

-- CreateIndex
CREATE INDEX "files_user_id_idx" ON "files"("user_id");

-- CreateIndex
CREATE INDEX "tg_id" ON "users"("tg_id");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_links_fkey" FOREIGN KEY ("link_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_files_fkey" FOREIGN KEY ("parent_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_users_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
