provider "aws" {
  region = "us-east-1"
}

# 1. Create S3 bucket for frontend
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "my-sanskrit-survey-frontend-bucket-2"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  tags = {
    Name = "SurveyFrontend"
  }
}

# 2. Disable S3 block public access (needed for bucket policy to apply)
resource "aws_s3_bucket_public_access_block" "frontend_access_block" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 3. Public read bucket policy
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "PublicReadGetObject",
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      }
    ]
  })
    depends_on = [aws_s3_bucket_public_access_block.frontend_access_block]
}

# 4. CloudFront distribution pointing to S3 static website
resource "aws_cloudfront_distribution" "frontend_cdn" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.website_endpoint
    origin_id   = "S3WebsiteOrigin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3WebsiteOrigin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "SurveyFrontendCDN"
  }
}

# 5. Outputs used by GitHub Actions
output "s3_bucket_name" {
  value = aws_s3_bucket.frontend_bucket.id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend_cdn.id
}
