# Overview
This document will walk you developing a minimal Puppet module using the the Puppet Development Kit and Visual Studio Code with the Puppet extension.
Along the way, we'll showcase some of the features of the extension.

## Installing
Before we do anything else, we'll need to download and install both the [PDK][pdk-install] and [VSCode][vscode-install].
Once we've got both of those installed, we're going to want to open VSCode to our home folder, initially.
You can do this by typing `code ~` in a terminal on Linux or MacOS, or in a PowerShell console on Windows.

Once we have VSCode open, the next thing we need to do is to install the Puppet extension.
To do so, we need to open the extension menu by one of the following:

+ Using a hotkey - `⇧⌘X` (MacOS) or `ctrl+shift+x` (Windows, Linux)
+ Clicking the extension icon on the activity bar
+ Navigating to `View -> Extensions` in the menu at the top of the program

Once we have the extensions menu open, we can search for the extension in the search bar - searching on `puppet` should bring up the extension.
We need to make sure we click the install button for the extension called `Puppet`, not one called `Puppet Support`.

Once we install the extension, we'll have the option to reload the window - we can do so by clicking the button labeled `Reload` in the activity bar.

Now that we have everything installed we're ready to create a new module!

## Initializing a Module
The first thing we need to do is scaffold out a new module.
From within VSCode, we need to bring up the command palette by doing one of the following:

+ Using a hotkey - `⇧⌘P` (MacOS) or `ctrl+shift+p` (Windows, Linux)
+ Navigating to `View -> Comand Palette` in the menu at the top of the program.

Once the command palette is visible in the top center of our window, we want to type `pdk new module` and hit enter.
This will cause the command to prompt you twice for input with helpful messages explaining what to type:

1. What is the name of the module you want to create?
For this quickstart guide, we're going to call our module `baby_elephant`.
2. Where should this module be scaffolded out?
This can be either an absolute or relative path.
For this quickstart guide, we're going to place our module in our home directory at `~/baby_elephant`
pdk.

Once we've done this, the module will be scaffolded out and a new window of VSCode opened inside it.

**Note:** Creating a new module via the command palette writes some default metadata information we're not going to worry about here.
If we need more control over that metadata, we can instead run [`pdk new module`][pdk-new-module-ref] from the [integrated terminal inside VSCode][vscode-terminal].
## Adding a Class
At this point, we've got a window of VSCode open with a newly scaffolded Puppet Module and need something to work on.
We can scaffold out a class, again using the PDK and the command palette.

Once the command palette is visible in the top center of our window, we want to type `pdk new class` and hit enter.
This will cause the command to prompt you for the name of the class you'd like to scaffold.
If you specify the name of the module, you'll scaffold out the `init.pp` file.
Specifying any other name for a class will create a file of the same name.

Here, we'll specify `baby_elephant` to get our `init.pp` file.
This will scaffold out two new files - `manifests/init.pp` and `spec/classes/baby_elephant_spec.rb`.

For now, we're just going to add a couple of resources. Copy the following into `manifests/init.pp`, overwriting the existing contents:

```puppet
class baby_elephant {
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

  file { "#{base_path}/baby_elephant.txt":
    content => $babyelephant,
  }
}

```
## Validate Module
Now that we've changed the module from the default template a little, we need to make sure we validate it.
We need to open the command pallette and type `pdk validate`, then hit enter.
This will trigger [validation of the module][pdk-validate] - first installing necessary dependencies, then checking syntax and style for files in the module.

We can also kick off the unit tests in the module, again from the command pallette (`pdk test unit`) - though at this point, we haven't edited them at all.

You 
## Preview Node Graph

## ?