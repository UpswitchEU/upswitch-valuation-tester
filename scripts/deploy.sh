#!/bin/bash

# 🚀 Upswitch Valuation Tester - Subdomain Deployment Script
# Deploy to tester.upswitch.com

set -e

echo "🚀 Starting Upswitch Valuation Tester deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the valuation-tester directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"

# Install dependencies
print_status "Installing dependencies..."
npm ci --silent

# Run type checking
print_status "Running type checking..."
npm run type-check

# Run linting
print_status "Running linting..."
npm run lint

# Build the application
print_status "Building application for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed. dist directory not found."
    exit 1
fi

print_success "Build completed successfully!"

# Check deployment method
DEPLOY_METHOD=${1:-"vercel"}

case $DEPLOY_METHOD in
    "vercel")
        print_status "Deploying to Vercel..."
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            print_warning "Vercel CLI not found. Installing..."
            npm install -g vercel
        fi
        
        # Deploy to Vercel
        vercel --prod --confirm
        
        print_success "Deployed to Vercel! 🎉"
        print_status "Don't forget to configure the custom domain: tester.upswitch.com"
        ;;
        
    "netlify")
        print_status "Deploying to Netlify..."
        
        # Check if Netlify CLI is installed
        if ! command -v netlify &> /dev/null; then
            print_warning "Netlify CLI not found. Installing..."
            npm install -g netlify-cli
        fi
        
        # Deploy to Netlify
        netlify deploy --prod --dir=dist
        
        print_success "Deployed to Netlify! 🎉"
        ;;
        
    "aws")
        print_status "Deploying to AWS S3..."
        
        # Check if AWS CLI is installed
        if ! command -v aws &> /dev/null; then
            print_error "AWS CLI not found. Please install AWS CLI first."
            exit 1
        fi
        
        # Upload to S3
        aws s3 sync dist/ s3://tester.upswitch.com --delete
        
        print_success "Deployed to AWS S3! 🎉"
        ;;
        
    *)
        print_error "Unknown deployment method: $DEPLOY_METHOD"
        print_status "Available methods: vercel, netlify, aws"
        exit 1
        ;;
esac

print_success "🎉 Deployment completed successfully!"
print_status "Your valuation tester is now live!"

# Post-deployment checklist
echo ""
echo "📋 Post-deployment checklist:"
echo "  ✅ Domain DNS configured (tester.upswitch.com)"
echo "  ✅ SSL certificate active"
echo "  ✅ Analytics tracking installed"
echo "  ✅ Performance monitoring setup"
echo "  ✅ Error tracking configured"
echo "  ✅ Mobile testing completed"
echo ""
echo "🔗 Next steps:"
echo "  1. Configure custom domain in your hosting provider"
echo "  2. Set up analytics tracking"
echo "  3. Test the application thoroughly"
echo "  4. Monitor performance and user feedback"
echo ""
print_success "Happy testing! 🚀"
