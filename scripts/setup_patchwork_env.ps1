# Patchwork Helper Environment Setup Script (PowerShell)
# -----------------------------------------------------
# Mini README:
# Installs Node dependencies for the Patchwork helper application.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/setup_patchwork_env.ps1

Write-Host "Installing Node dependencies..."
npm install
Write-Host "Setup complete."
