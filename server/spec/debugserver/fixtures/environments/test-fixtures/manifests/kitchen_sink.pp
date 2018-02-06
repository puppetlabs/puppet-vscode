# Manifest that has everything

# Class: nestedclass  # <--- Breakpoint here
#
class nestedclass {
  # line based breakpoints
  $nested_variable = 'Yay Puppet!'

  user { 'missing_user':
    ensure => 'absent'
  }

  alert('This is an alert message')

  notify {'nested_notify': }

  ["routers", "servers", "workstations"].each |$item| {
    notify { $item: }
  }
}

# Class: democlass
#
class democlass {
  $before_var = 'before'

  include nestedclass

  $after_var = 'after'

  notify {'demo_notify': }
}

$a_test_string = 'This is a string'
$a_test_array = [1,2,3]

notice('The start')

include democlass   # <--- Breakpoint here

$another_test_array = split('v1.v2:v3.v4', ':')

notice('The end!')
