# PowerShell completion for velocita. Install: add `. path\to\velocita.ps1` to your $PROFILE
Register-ArgumentCompleter -Native -CommandName velocita -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $words = $commandAst.CommandElements | ForEach-Object { $_.ToString() }
  $prev = if ($words.Count -gt 1) { $words[-1] } else { '' }
  if ($wordToComplete -ne '' -and $words.Count -gt 1) { $prev = $words[-2] }
  $options = switch ($true) {
    ($words.Count -le 2 -and $prev -notmatch '^-') { 'new', 'dev', 'build', 'audit', 'check', 'deploy', 'help' }
    ($prev -eq '--template') { 'blog', 'docs', 'business', 'news', 'portfolio' }
    ($prev -eq 'init') { 'github', 'cloudflare', 'netlify', 'vercel' }
    ($words[1] -eq 'new') { '--template', '--title', '--yes' }
    ($words[1] -eq 'dev') { '--port', '--host' }
    ($words[1] -eq 'build') { '--clean', '--strict', '--check', '--indexnow' }
    ($words[1] -eq 'deploy') { 'init', 'cloudflare', 'netlify', 'vercel' }
    default { @() }
  }
  $options | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
  }
}
