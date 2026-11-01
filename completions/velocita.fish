# fish completion for velocita. Install: copy to ~/.config/fish/completions/
set -l cmds new dev build audit check deploy
complete -c velocita -f
complete -c velocita -n "not __fish_seen_subcommand_from $cmds" -a new -d 'Scaffold a site'
complete -c velocita -n "not __fish_seen_subcommand_from $cmds" -a dev -d 'Dev server with live reload'
complete -c velocita -n "not __fish_seen_subcommand_from $cmds" -a build -d 'Production build'
complete -c velocita -n "not __fish_seen_subcommand_from $cmds" -a audit -d 'SEO audit'
complete -c velocita -n "not __fish_seen_subcommand_from $cmds" -a check -d 'Performance budget'
complete -c velocita -n "not __fish_seen_subcommand_from $cmds" -a deploy -d 'Deploy config / publish'
complete -c velocita -n "__fish_seen_subcommand_from new" -l template -xa 'blog docs business news portfolio'
complete -c velocita -n "__fish_seen_subcommand_from new" -l title -x
complete -c velocita -n "__fish_seen_subcommand_from dev" -l port -x
complete -c velocita -n "__fish_seen_subcommand_from dev" -l host -x
complete -c velocita -n "__fish_seen_subcommand_from build" -l clean -l strict -l check -l indexnow
complete -c velocita -n "__fish_seen_subcommand_from deploy" -xa 'init cloudflare netlify vercel'
complete -c velocita -n "__fish_seen_subcommand_from new dev build audit check" -xa '(__fish_complete_directories)'
complete -c velocita -n "__fish_seen_subcommand_from new" -l yes -d 'No questions, use defaults'
