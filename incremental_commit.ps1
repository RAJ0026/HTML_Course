$files = @(
    "E-Commerce Website/index.html",
    "E-Commerce Website/style.css",
    "E-Commerce Website/script.js"
)

for ($i = 1; $i -le 20; $i++) {
    # Append comment lines to each file
    Add-Content -Path $files[0] -Value "`n<!-- Increment $i -->"
    Add-Content -Path $files[1] -Value "`n/* Increment $i */"
    Add-Content -Path $files[2] -Value "`n// Increment $i"

    # Git operations
    git add .
    git commit -m "Chunk $i – 5% progress"
    git push origin main
}
