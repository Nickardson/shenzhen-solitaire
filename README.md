# SHENZHEN I/O Solitaire Game

![Preview image](http://i.imgur.com/pSFk7Jr.jpg)

Yes, this is in the browser!

## How to install
1. Download this project from Github as a .zip, and extract.

2. Locate the SHENZHEN I/O solitaire textures folder from your installation.

   This will be something like `steamapps\common\SHENZHEN IO\Content\textures\solitaire`

3. Copy the contents of that folder into the `solitaire` folder in the project.

4. Open index.html in your browser.

5. (If you don't own SHENZHEN I/O, you can still play the game, but it's not nearly as pretty.)


## How to play

The goal of the game is to stack all the numbered cards in the upper-right, and place all the logoed 'Dragon' cards in the upper-left.

In the main area, numbered cards can be stacked if each is one less than the last, and two cards of the same suit cannot touch.
Multiple cards can be moved around the main area if they form a valid stack.

The upper-left slots are either used as spare slots for a single card, or to stack the Dragons.

To place Dragon cards in the upper-left, when all four cards are on the top of their stacks or in the spare slots, click the button for that suit to move them to an available slot.
To place numbered cards in the upper-right, they must be of the same suit, each one greater than the last, starting with 1. This will also happen automatically if nothing on the board could be placed on that card.

_This project is not associated with Zachtronics or SHENZHEN I/O._
