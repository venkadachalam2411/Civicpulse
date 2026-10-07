import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

async function testS3Connection() {
  console.log('=== CivicPulse AWS S3 Configuration & Upload Test ===\n');

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  console.log('Environment Variables Check:');
  console.log(`- AWS_REGION: ${region || '❌ NOT SET'}`);
  console.log(`- AWS_S3_BUCKET: ${bucket || '❌ NOT SET'}`);
  console.log(`- AWS_ACCESS_KEY_ID: ${accessKeyId ? (accessKeyId === 'your_aws_access_key_id' ? '⚠️ STILL PLACEHOLDER' : '✅ SET (' + accessKeyId.substring(0, 4) + '***)') : '❌ NOT SET'}`);
  console.log(`- AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? (secretAccessKey === 'your_aws_secret_access_key' ? '⚠️ STILL PLACEHOLDER' : '✅ SET (Length: ' + secretAccessKey.length + ')') : '❌ NOT SET'}`);
  console.log('');

  if (!bucket || !region || !accessKeyId || !secretAccessKey || accessKeyId === 'your_aws_access_key_id') {
    console.error('❌ S3 configuration is incomplete in backend/.env!');
    console.error('Please make sure backend/.env has:');
    console.error('  AWS_REGION=your_aws_region (e.g. ap-south-1 or us-east-1)');
    console.error('  AWS_ACCESS_KEY_ID=your_actual_access_key');
    console.error('  AWS_SECRET_ACCESS_KEY=your_actual_secret_key');
    console.error('  AWS_S3_BUCKET=your_exact_bucket_name');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  console.log(`1. Testing upload to S3 bucket "${bucket}"...`);
  const testKey = `test/s3-test-${Date.now()}.txt`;
  const testBody = `CivicPulse AWS S3 upload test performed at ${new Date().toISOString()}`;

  try {
    const uploadCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: Buffer.from(testBody),
      ContentType: 'text/plain',
    });

    await s3Client.send(uploadCmd);
    console.log(`✅ SUCCESS! File uploaded to S3:`);
    console.log(`   Bucket: ${bucket}`);
    console.log(`   Key: ${testKey}`);
    console.log(`   Location: https://${bucket}.s3.${region}.amazonaws.com/${testKey}`);
    console.log('\n🎉 Your AWS S3 bucket and credentials are functioning properly for storage!');
  } catch (err: any) {
    console.error('\n❌ AWS S3 Upload Failed with error:');
    console.error(`- Name: ${err.name}`);
    console.error(`- Message: ${err.message}`);
    if (err.Code) console.error(`- Code: ${err.Code}`);
    if (err.$metadata) console.error(`- HTTP Status: ${err.$metadata.httpStatusCode}`);

    console.log('\nCommon Fixes:');
    if (err.name === 'NoSuchBucket' || err.Code === 'NoSuchBucket') {
      console.log('👉 The bucket name does not exist in this region. Check AWS_S3_BUCKET and AWS_REGION.');
    } else if (err.name === 'InvalidAccessKeyId' || err.Code === 'InvalidAccessKeyId') {
      console.log('👉 AWS_ACCESS_KEY_ID is invalid or does not exist.');
    } else if (err.name === 'SignatureDoesNotMatch' || err.Code === 'SignatureDoesNotMatch') {
      console.log('👉 AWS_SECRET_ACCESS_KEY is incorrect. Check for extra spaces or typos.');
    } else if (err.name === 'AccessDenied' || err.Code === 'AccessDenied') {
      console.log('👉 Your IAM user does not have permission to upload (s3:PutObject) to this bucket.');
    }
  }
}

testS3Connection();
