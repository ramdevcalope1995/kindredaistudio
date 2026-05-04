variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "kindred-ai-studio"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "kindredai"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "kindredadmin"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}