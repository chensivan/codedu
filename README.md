# Codeon for Atom

*Asynchronous responses to on-demand requests.*

This is an extension for [Atom](atom.io) that serves as interface to a system that
enables more effective task hand-off between end-user developers and
remote helpers by allowing asynchronous responses to on-demand requests.
With this plugin, developers can request help by speaking their requests
aloud within the context of the Atom IDE.

## Getting started

To start using Codeon you will first need to take care of some
prerequisites to install the plugin. Below there is a guide that
will take you through the requirements for Codeon the installation
process.

### Atom

The Codeon plugin requires that you run the latest version of Atom. You can
download it from the following link:

-   [Atom](https://atom.io/)


#### Installation

##### For Mac

1.  Uncompress atom-mac.zip to get the application launcher.
2.  Move (Drag) the application launcher to the Applications folder to
    the left of the Finder.

***Note:*** *If you already have a version of Atom in your system that
you wish to keep rename the application launcher to something else so you
don’t overwrite the existing app.*

##### For Windows

1.  Download and run “AtomSetup.exe” for automatic installation.
1.  Check that this is the correct version by going to Help > About Atom

#### Disabling Automatic Updates

1.  Open Atom.

2.  Open the Settings view

        Packages > Settings View > Open

In the Core Settings disable the Automatically Update option.

***Note:*** *If you have more than one version of Atom, they will be
sharing the same settings files, so be careful not to enable this
setting accidentally while using the latest version.*

### NodeJS

The Codeon plugin uses `npm` to manage its
dependencies, so you will need to install NodeJS to have access to its
package manager.

#### Download

Get the latest version of NodeJS for your platform in the following
link:

-   [Node.js](https://nodejs.org/en/download/)

#### Installation

##### For Mac

-   Open node-vX.Y.Z.pkg to start the installer.
-   Follow the installer instructions to finish the install
-   Verify the installation by opening a terminal window and typing the
    following command and pressing enter (search “Terminal” in the
    spotlight to open it).

        $ node -v

***Note:*** *the dollar sign ($) represents
the terminal prompt, you don’t have to type it when you’re executing a
command.*

##### For Windows

-   Download the appropriate Windows Installer (32-bit or 64-bit)
-   Click to run, which will open the NodeJS setup wizard. Follow the
    steps in that window to install
-   Verify that Node.js is listed under ‘All Programs’ in the
    start menu.

### Codeon Plugin

This is the actual plugin that provides the requester’s interface in
Atom. Follow these steps to get the package and load it into Atom.

***Note:*** *if you are planning on developing the application you
should review the section for developers at the end.*

#### Installation

-   Open a terminal window and execute the following command.

        $ apm install https://github.com/chensivan/codedu

#### Setup the server

Now you should either setup a local server to manage the requests or
configure Codeon to connect with a remote server. You can find more
information in setting up your local server in this
[repository](https://github.com/chensivan/codeon-server).

### Troubleshooting

-   Failed to activate the atom-codeon package: Cannot
    find module 'socket.io-client'

    -   Folders `socket.io-adapter`, `socket.io-client`, `socket.io-parser` are
        stored in `atom-codeon\node_modules\socket.io\node_modules` (the
        directory that was cloned) and need to be moved up two directories. If
        this persists, confirm that the symbolic link worked and that the same
        change was made in `~/.atom/packages/atom-codeon` as well.

-   If using Windows: There may be an issue with the server due to
    filepath name differences on Mac and Windows (backslashes vs.
    forward slashes)

## Usage

You can toggle request list using CMD + SHIFT + V.

You can start recording using CMD + SHIFT + E.

Now open Atom, and try it!

## Developers

If you plan on collaborating with this repository, you will have to
[clone](https://help.github.com/articles/cloning-a-repository/)
this repository, and create a symbolic link from the local repo to
Atom’s packages directory so that it loads using the latest version
of the code. This can be done with the following command:

    $ ln -s /path/to/this/repo ~>/.atom/packages/atom-codeon

If this doesn't work, try to make the link by giving the full path to
each directory, for example:

    $ ln -s C:/Users/path/to/repo C:/Users/User/.atom/packages

Changing the paths as needed.

Alternatively, you can make a symbolic link to the standard installation
by switching the locations in the previous command.
