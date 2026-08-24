param(
    [switch]$SkipProjectSetup,
    [switch]$NonInteractive,
    [string]$ApiKey
)

function Write-Banner {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "   STOCKPULSE : AUTOMATED ENVIRONMENT AND DEPENDENCY PROVISIONER" -ForegroundColor Yellow
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "   Targeting: Java 21 LTS (JDK) | Apache Maven | Node.js LTS | Git" -ForegroundColor Gray
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "[ STEP ] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  [INFO] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "  [ERROR] $Message" -ForegroundColor Red
}

function Refresh-EnvVariables {
    Write-Info "Refreshing session PATH and Environment Variables..."
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
    $env:Path = $machinePath + ";" + $userPath

    if (-not $env:JAVA_HOME) {
        $adoptiumDir = "C:\Program Files\Eclipse Adoptium"
        if (Test-Path $adoptiumDir) {
            $defaultTemurin = Get-ChildItem -Path $adoptiumDir -Filter "jdk-21*" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($defaultTemurin) {
                $env:JAVA_HOME = $defaultTemurin.FullName
                $env:Path = $env:JAVA_HOME + "\bin;" + $env:Path
                [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $env:JAVA_HOME, [System.EnvironmentVariableTarget]::User)
            }
        }
    }
}

Write-Banner

# 1. Check Winget Availability
Write-Step "1/5 Checking Windows Package Manager (winget)..."
$wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
if (-not $wingetCmd) {
    Write-Err "winget is not available on this machine."
    Write-Info "Please install 'App Installer' from the Microsoft Store or update Windows."
    exit 1
}
$wingetVersion = winget --version
Write-Success "winget is available ($wingetVersion)"

# 2. Check & Install Git
Write-Step "2/5 Checking Git Installation..."
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) {
    $gitVer = git --version
    Write-Success "Git is already installed: $gitVer"
} else {
    Write-Info "Git not found. Installing Git.Git via winget..."
    winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements --silent
    Refresh-EnvVariables
    Write-Success "Git installation completed."
}

# 3. Check & Install Java 21 LTS (JDK)
Write-Step "3/5 Checking Java 21 LTS (JDK) Installation..."
$javaVerOutput = & java -version 2>&1
$hasJava21 = $false
if ($javaVerOutput) {
    $firstLine = [string]$javaVerOutput[0]
    if ($firstLine -match "21\.") {
        $hasJava21 = $true
        Write-Success "Java 21 is already active: $firstLine"
    }
}

if (-not $hasJava21) {
    Write-Info "Java 21 not detected. Installing EclipseAdoptium.Temurin.21.JDK via winget..."
    winget install --id EclipseAdoptium.Temurin.21.JDK -e --accept-package-agreements --accept-source-agreements --silent
    Refresh-EnvVariables
    Write-Success "Java 21 installation completed."
}

# 4. Check & Install Apache Maven
Write-Step "4/5 Checking Apache Maven Installation..."
$mvnCmd = Get-Command mvn -ErrorAction SilentlyContinue
if ($mvnCmd) {
    $mvnVer = (mvn -v | Select-Object -First 1)
    Write-Success "Maven is already installed: $mvnVer"
} else {
    Write-Info "Maven not found. Installing Apache.Maven via winget..."
    winget install --id Apache.Maven -e --accept-package-agreements --accept-source-agreements --silent
    Refresh-EnvVariables
    Write-Success "Apache Maven installation completed."
}

# 5. Check & Install Node.js LTS
Write-Step "5/5 Checking Node.js LTS Installation..."
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeVer = node -v
    $npmVer = npm -v
    Write-Success "Node.js is already installed: $nodeVer (npm $npmVer)"
} else {
    Write-Info "Node.js not found. Installing OpenJS.NodeJS.LTS via winget..."
    winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements --silent
    Refresh-EnvVariables
    Write-Success "Node.js LTS installation completed."
}

# 6. Project Bootstrap (Environment & Dependencies)
if (-not $SkipProjectSetup) {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "   BOOTSTRAPPING STOCKPULSE PROJECT FILES" -ForegroundColor Yellow
    Write-Host "========================================================================" -ForegroundColor Cyan

    $rootPath = $PSScriptRoot
    if (-not $rootPath) { $rootPath = Get-Location }

    # Setup .env
    $envPath = Join-Path $rootPath ".env"
    $envExamplePath = Join-Path $rootPath ".env.example"
    if ((-not (Test-Path $envPath)) -and (Test-Path $envExamplePath)) {
        Write-Info "Creating .env from .env.example..."
        Copy-Item $envExamplePath $envPath
        Write-Success ".env configuration initialized."
    }

    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
        $currentApiKey = ""
        if ($envContent -match 'LLM_API_KEY=([^\r\n]+)') {
            $currentApiKey = $matches[1].Trim()
        } elseif ($envContent -match 'LITELLM_API_KEY=([^\r\n]+)') {
            $currentApiKey = $matches[1].Trim()
        }

        # Prompt or configure API key
        if ($ApiKey -and $ApiKey.Trim() -ne "") {
            $trimmedKey = $ApiKey.Trim()
            if ($envContent -match 'LLM_API_KEY=.*') {
                $envContent = $envContent -replace 'LLM_API_KEY=.*', "LLM_API_KEY=$trimmedKey"
            } else {
                $envContent += "`nLLM_API_KEY=$trimmedKey"
            }
            if ($envContent -match 'LITELLM_API_KEY=.*') {
                $envContent = $envContent -replace 'LITELLM_API_KEY=.*', "LITELLM_API_KEY=$trimmedKey"
            }
            Set-Content -Path $envPath -Value $envContent -Encoding UTF8
            Write-Success "API Key configured from argument and saved to .env."
        } elseif (-not $NonInteractive) {
            Write-Host ""
            Write-Host "------------------------------------------------------------------------" -ForegroundColor Cyan
            Write-Host "   KEY CONFIGURATION : ZYCUS LITELLM / GEMINI AI GATEWAY" -ForegroundColor Yellow
            Write-Host "------------------------------------------------------------------------" -ForegroundColor Cyan
            if ($currentApiKey -and $currentApiKey -ne "your_litellm_api_key_here") {
                $masked = $currentApiKey.Substring(0, [Math]::Min(8, $currentApiKey.Length)) + "..."
                Write-Host "   Existing API Key detected: $masked" -ForegroundColor Gray
                Write-Host "   Press [ENTER] to keep existing key, or type a new API key below:" -ForegroundColor White
            } else {
                Write-Host "   Enter your Zycus LiteLLM / Gemini API Key" -ForegroundColor White
                Write-Host "   (or press [ENTER] to use default demo simulation engine):" -ForegroundColor Gray
            }
            $inputKey = Read-Host "   > API Key"
            if ($inputKey -and $inputKey.Trim() -ne "") {
                $trimmedKey = $inputKey.Trim()
                if ($envContent -match 'LLM_API_KEY=.*') {
                    $envContent = $envContent -replace 'LLM_API_KEY=.*', "LLM_API_KEY=$trimmedKey"
                } else {
                    $envContent += "`nLLM_API_KEY=$trimmedKey"
                }
                if ($envContent -match 'LITELLM_API_KEY=.*') {
                    $envContent = $envContent -replace 'LITELLM_API_KEY=.*', "LITELLM_API_KEY=$trimmedKey"
                }
                Set-Content -Path $envPath -Value $envContent -Encoding UTF8
                Write-Success "API Key successfully updated and saved to .env."
            } else {
                Write-Info "Keeping existing API configuration in .env."
            }
            Write-Host "------------------------------------------------------------------------" -ForegroundColor Cyan
        }
    }

    # Frontend npm install
    $frontendPath = Join-Path $rootPath "frontend"
    if (Test-Path $frontendPath) {
        Write-Info "Installing Frontend NPM dependencies (React 18, Vite, Tailwind CSS)..."
        Push-Location $frontendPath
        try {
            npm install
            Write-Success "Frontend dependencies installed successfully."
        } catch {
            Write-Err "npm install encountered an issue: $_"
        } finally {
            Pop-Location
        }
    }

    # Backend Maven compile check
    $backendPath = Join-Path $rootPath "backend"
    if (Test-Path $backendPath) {
        Write-Info "Testing Backend Maven Build (Spring Boot 3.3.4)..."
        Push-Location $backendPath
        try {
            mvn test-compile
            Write-Success "Backend compiled successfully."
        } catch {
            Write-Err "Maven compile test encountered an issue: $_"
        } finally {
            Pop-Location
        }
    }
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "   ENVIRONMENT PROVISIONING AND SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   APPLICATION ENDPOINTS AND ACCESS LINKS:" -ForegroundColor White
Write-Host "   --------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "   React 18 Console UI:        http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Autonomous Simulation Lab:  http://localhost:5173 (Tab: 'Simulation (1d=1m)')" -ForegroundColor Cyan
Write-Host "   Interactive API Explorer:   http://localhost:5173 (Tab: 'API Explorer')" -ForegroundColor Cyan
Write-Host "   Spring Boot REST API:       http://localhost:8080" -ForegroundColor Yellow
Write-Host "   Telemetry and Dashboard:    http://localhost:8080/api/analytics/dashboard" -ForegroundColor Yellow
Write-Host "   Real-Time SSE Event Stream: http://localhost:8080/api/events/stream" -ForegroundColor Yellow
Write-Host "   H2 Database Web Console:    http://localhost:8080/h2-console" -ForegroundColor Magenta
Write-Host "      (JDBC URL: jdbc:h2:mem:stockpulsedb | User: sa | Password: [blank])" -ForegroundColor Gray
Write-Host "   --------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "   QUICKSTART LAUNCH COMMANDS:" -ForegroundColor White
Write-Host "   --------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "   1-Click Fullstack Launcher: .\start-stockpulse.bat (or .\start-stockpulse.ps1)" -ForegroundColor Green
Write-Host "   Or Manual Step 1 (Backend): cd backend; mvn spring-boot:run" -ForegroundColor Yellow
Write-Host "   Or Manual Step 2 (Frontend): cd frontend; npm run dev" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
