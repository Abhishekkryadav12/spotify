$ErrorActionPreference = "Stop"
$adb = "C:\Users\ADMIN\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"

Write-Host "[1/3] Checking connected Android device via ADB..."
& $adb devices

Write-Host "[2/3] Setting up USB reverse port forwarding (8081 -> Metro, 5000 -> Python backend)..."
& $adb reverse tcp:8081 tcp:8081
& $adb reverse tcp:5000 tcp:5000
& $adb reverse --list

# Watchdog job to launch Expo Go on phone once Metro port 8081 is listening
Start-Job -ScriptBlock {
    param($adbPath)
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        $listening = (netstat -ano | Select-String ":8081.*LISTENING")
        if ($listening) {
            Write-Host "[Watchdog] Metro is listening on 8081. Ensuring port reversal..."
            & $adbPath reverse tcp:8081 tcp:8081
            & $adbPath reverse tcp:5000 tcp:5000
            Start-Sleep -Milliseconds 800
            Write-Host "[Watchdog] Opening exp://127.0.0.1:8081 on connected phone..."
            & $adbPath shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"
            break
        }
    }
} -ArgumentList $adb | Out-Null

Write-Host "[3/3] Starting Metro Bundler on localhost:8081 with 8GB heap..."
cmd.exe /c "set NODE_OPTIONS=--max-old-space-size=8192 && npx expo start --localhost"
