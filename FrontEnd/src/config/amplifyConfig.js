const amplifyConfig = {
  aws_project_region: import.meta.env.VITE_AWS_PROJECT_REGION, // e.g., "us-east-1"
  aws_cognito_region: import.meta.env.VITE_AWS_COGNITO_REGION,
  aws_user_pools_id: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
  aws_user_pools_web_client_id: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
  Storage: {
    AWSS3: {
      bucket: import.meta.env.VITE_AWS_S3_BUCKET, // e.g., "my-app-bucket"
      region: import.meta.env.VITE_AWS_S3_REGION, // e.g., "us-east-1"
    },
  },
};

export default amplifyConfig;
