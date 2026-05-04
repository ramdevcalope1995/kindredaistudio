# Backend configuration for Terraform state
# This file is used to configure where Terraform stores its state file

# Example for S3 backend:
# terraform {
#   backend "s3" {
#     bucket         = "my-terraform-state-bucket"
#     key            = "kindred-ai-studio/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "my-terraform-locks"
#   }
# }