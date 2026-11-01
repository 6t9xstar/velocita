#compdef velocita
# zsh completion for velocita. Install: put this file on your $fpath as _velocita
_velocita() {
  local -a commands
  commands=(
    'new:scaffold a site from a template'
    'dev:dev server with live reload'
    'build:production build to dist/'
    'audit:site-wide SEO audit'
    'check:performance budget check'
    'deploy:write host config or publish'
  )
  if (( CURRENT == 2 )); then _describe 'command' commands; return; fi
  case $words[2] in
    new)    _arguments '--template[starter]:template:(blog docs business news portfolio)' '--title[site title]:title:' '--yes[no questions]' '*:dir:_files -/' ;;
    dev)    _arguments '--port[port]:port:' '--host[bind address]:host:' '*:dir:_files -/' ;;
    build)  _arguments '--clean[delete dist first]' '--strict[fail on broken links]' '--check[fail on budget]' '--indexnow[ping IndexNow]' '*:dir:_files -/' ;;
    deploy) _arguments '1:target:(init cloudflare netlify vercel)' '2:host:(github cloudflare netlify vercel)' '*:dir:_files -/' ;;
    *)      _files -/ ;;
  esac
}
_velocita "$@"
