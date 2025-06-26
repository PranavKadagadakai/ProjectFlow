const amplifyConfig = {
  // AWS Project Region might be the same as Cognito/S3 region, or a broader project region
  aws_project_region: import.meta.env.VITE_AWS_PROJECT_REGION, // e.g., "us-east-1"

  // Auth configuration (for Cognito)
  aws_user_pools_id: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
  aws_user_pools_web_client_id: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
  aws_cognito_region: import.meta.env.VITE_AWS_COGNITO_REGION,

  // Storage configuration (for S3)
  Storage: {
    S3: {
      // Use S3 key directly under Storage for v6+
      bucket: import.meta.env.VITE_AWS_S3_BUCKET, // e.g., "my-app-bucket"
      region: import.meta.env.VITE_AWS_S3_REGION, // e.g., "us-east-1"
    },
  },
};

export default amplifyConfig;
