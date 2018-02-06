if $facts['os']['family'] == 'windows' {
  $base_path = 'C:/baby_elephant'
} else {
  $base_path = '/tmp/baby_elephant'
}

$babyelephant = @("ASCII")
                  /  \~~~/  \
            ,~~~~(     ..    )
          /      \___    __/
        /|           \  |
        ^ \   /___\  /\ |
          |__|    |__| ''

      Hi! I am a baby elephant!
        I make trumpet sounds!
                PAWOO!
| ASCII

file { $base_path:
  ensure => directory,
}

file { "${base_path}/baby_elephant.txt":
  content => $babyelephant,
}
