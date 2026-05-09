const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { Client } = require("minio");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const execFileAsync = util.promisify(execFile);

const MONGO_URI =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://localhost:27017";
const MONGODUMP_PATH = process.env.MONGODUMP_PATH || "mongodump";
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "localhost";
const MINIO_PORT = parseInt(process.env.MINIO_PORT || "9000", 10);
const MINIO_USE_SSL =
    (process.env.MINIO_USE_SSL || "false").toLowerCase() === "true";
const MINIO_ACCESS_KEY =
    process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY || "admin";
const MINIO_SECRET_KEY =
    process.env.MINIO_ROOT_PASSWORD ||
    process.env.MINIO_SECRET_KEY ||
    "password123";
const MINIO_BUCKET = process.env.MINIO_BACKUP_BUCKET || "backups";

const backupDir = path.resolve(__dirname, "..", "tmp-backups");

async function ensureDirectory(folder) {
    await fs.promises.mkdir(folder, { recursive: true });
}

async function runMongoDump(archivePath) {
    console.log(`🔄 Creating MongoDB backup archive at ${archivePath}`);
    await execFileAsync(MONGODUMP_PATH, [
        `--uri=${MONGO_URI}`,
        `--archive=${archivePath}`,
        "--gzip",
    ]);
}

async function ensureBucket(minioClient, bucket) {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
        console.log(`📦 Creating MinIO bucket: ${bucket}`);
        await minioClient.makeBucket(bucket, "us-east-1");
    }
}

async function uploadBackup(minioClient, bucket, archivePath, objectName) {
    const stat = await fs.promises.stat(archivePath);
    console.log(`☁️ Uploading ${objectName} to MinIO bucket ${bucket}`);
    const stream = fs.createReadStream(archivePath);
    await minioClient.putObject(bucket, objectName, stream, stat.size, {
        "Content-Type": "application/gzip",
    });
    console.log(`✅ Uploaded backup to ${bucket}/${objectName}`);
}

async function run() {
    try {
        await ensureDirectory(backupDir);

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const archiveName = `mongo-backup-${timestamp}.gz`;
        const archivePath = path.join(backupDir, archiveName);

        await runMongoDump(archivePath);

        const minioClient = new Client({
            endPoint: MINIO_ENDPOINT,
            port: MINIO_PORT,
            useSSL: MINIO_USE_SSL,
            accessKey: MINIO_ACCESS_KEY,
            secretKey: MINIO_SECRET_KEY,
        });

        await ensureBucket(minioClient, MINIO_BUCKET);
        await uploadBackup(minioClient, MINIO_BUCKET, archivePath, archiveName);

        console.log("🏁 MongoDB backup completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ MongoDB backup failed:", error.message || error);
        process.exit(1);
    }
}

run();