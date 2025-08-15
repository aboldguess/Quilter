#!/bin/bash
# Patchwork Helper Environment Setup Script
# -----------------------------------------
# Mini README:
# Installs Node dependencies for the Patchwork helper application.
# Usage:
#   bash scripts/setup_patchwork_env.sh

set -e

echo "Installing Node dependencies..."
npm install

echo "Setup complete."
