# bash completion for velocita. Install: source this file from ~/.bashrc
_velocita() {
  local cur prev cmd
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  cmd="${COMP_WORDS[1]}"
  case "$prev" in
    --template) COMPREPLY=($(compgen -W "blog docs business news portfolio" -- "$cur")); return ;;
    --port|--host|--title) return ;;
    init) COMPREPLY=($(compgen -W "github cloudflare netlify vercel" -- "$cur")); return ;;
  esac
  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=($(compgen -W "new dev build audit check deploy help" -- "$cur")); return
  fi
  case "$cmd" in
    new)    COMPREPLY=($(compgen -W "--template --title --yes" -- "$cur")) ;;
    dev)    COMPREPLY=($(compgen -W "--port --host" -- "$cur")) ;;
    build)  COMPREPLY=($(compgen -W "--clean --strict --check --indexnow" -- "$cur")) ;;
    deploy) COMPREPLY=($(compgen -W "init cloudflare netlify vercel" -- "$cur")) ;;
  esac
  [[ ${#COMPREPLY[@]} -eq 0 && "$cur" != -* ]] && COMPREPLY=($(compgen -d -- "$cur"))
}
complete -F _velocita velocita
