'use strict';

var useLocalStorage = (typeof localStorage !== 'undefined');

/**
 * if true, allows placing any card in the Flower slot, and dragons are always movable.
 * @type {Boolean}
 */
var DEBUG = false;

/**
 * if true, the alternate stylesheet is loaded even if images load correctly.
 * @type {Boolean}
 */
var DEBUG_STYLE = false;

/**
 * Time in milliseconds cards take moving around
 * @type {Number}
 */
var CARD_ANIMATION_SPEED = 100;

/**
 * Gap in pixels between cards when fanned out.
 * @type {Number}
 */
var CARD_STACK_GAP = 30;

/**
 * The seed of the game being played right now.
 */
var currentSeed;

var bambooWhiteToGreen = 'sepia(100%) saturate(10000%) hue-rotate(63deg) brightness(.35)';

var SUITS = {
	BAMBOO: {
		order: 1,
		color: '#17714e',
		prefix_large: 'bamboo',
		small: 'bamboo',
		fixAssetsFilter: bambooWhiteToGreen, // apply a color the the bamboo/green-dragon images since they changed to white.
	},
	CHARACTERS: {
		order: 2,
		color: '#000000',
		prefix_large: 'char',
		small: 'characters'
	},
	COINS: {
		order: 3,
		color: '#ae2810',
		prefix_large: 'coins',
		small: 'coins'
	}
};

var SPECIAL = {
	DRAGON_GREEN: {
		order: 1,
		large: 'dragon_green',
		small: 'dragon_green',
		equivalentSuit: 'bamboo',
		fixAssetsFilter: bambooWhiteToGreen, // apply a color the the bamboo/green-dragon images since they changed to white.
	},
	DRAGON_RED: {
		order: 2,
		large: 'dragon_red',
		small: 'dragon_red',
		equivalentSuit: 'coins',
	},
	DRAGON_WHITE: {
		order: 3,
		large: 'dragon_white',
		small: 'dragon_white',
		equivalentSuit: 'characters',
	},
	FLOWER: {
		order: 4,
		large: 'flower',
		small: 'flower',
		equivalentSuit: 'flower',
	}
};

/**
 * Number of each type of dragon to create.
 * @type {Number}
 */
var DRAGON_COUNT = 4;

/**
 * Height in px of the tray slots.
 * @type {Number}
 */
var SLOT_TALL = 500;

/**
 * Contains groupings of slots, which will have an "element" property added.
 * @type {Object}
 */
var SLOTS = {
	SPARE: [
		{
			type: 'spare',
			top: 18,
			left: 46
		},
		{
			type: 'spare',
			top: 18,
			left: 198
		},
		{
			type: 'spare',
			top: 18,
			left: 350
		}
	],
	FLOWER: [
		{
			type: 'flower',
			top: 18,
			left: 614
		}
	],
	OUT: [
		{
			type: 'out',
			top: 18,
			left: 806
		},
		{
			type: 'out',
			top: 18,
			left: 958
		},
		{
			type: 'out',
			top: 18,
			left: 1110
		}
	],
	TRAY: [
		{
			type: 'tray',
			fan: true,
			top: 282,
			left: 46,
			height: SLOT_TALL
		},
		{
			type: 'tray',
			fan: true,
			top: 282,
			left: 198,
			height: SLOT_TALL
		},
		{
			type: 'tray',
			fan: true,
			top: 282,
			left: 350,
			height: SLOT_TALL
		},
		{
			type: 'tray',
			fan: true,
			top: 282,
			left: 502,
			height: SLOT_TALL
		},
		{
			type: 'tray',
			fan: true,
			top: 282,
			left: 654,
			height: SLOT_TALL
		},
		{
			type: 'tray',
			fan: true,
			top: 282,
			left: 806,
			height: SLOT_TALL
		},
		{
			type: 'tray',
			fan: true,
			top: 282,
			left: 958,
			height: SLOT_TALL
		},
		{
			type: 'tray',
			fan: true,
			top: 282,
			left: 1110,
			height: SLOT_TALL
		}
	]
};

// Audio element for OST
var music = null;

jQuery.fn.visible = function () {
	return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function () {
	return this.css('visibility', 'hidden');
};

jQuery.fn.visibilityToggle = function () {
	return this.css('visibility', function (i, visibility) {
		return (visibility == 'visible') ? 'hidden' : 'visible';
	});
};

/**
 * Creates a card of the given value and suit.
 * @param  {Integer} value
 * @param  {SUIT} suit 
 * @return {Card} {element: HTMLElement, value: Integer, suit: SUIT}
 */
function createCard(value, suit) {
	var smallImg = 'solitaire/small_icons/' + suit.small + '.png';
	var largeImg = 'solitaire/large_icons/' + suit.prefix_large + '_' + value + '.png';
	var card = $('<div class="card card-numbered nickardson card-' + suit.small + ' card-' + value + '">' +
		'<div class="card-count-a"></div>' +
		'<div class="card-count-b"></div>' +
		'<div class="card-mini-logo-a"></div>' +
		'<div class="card-mini-logo-b"></div>' +
		'<div class="card-logo"></div>' +
		'</div>');

	card.css('color', suit.color);
	card.find('.card-count-a,.card-count-b').text(value);
	card.find('.card-mini-logo-a,.card-mini-logo-b')
		.css({
			'background-image': 'url(' + smallImg + ')',
			'filter': suit.fixAssetsFilter
		});
	card.find('.card-logo')
		.css({
			'background-image': 'url(' + largeImg + ')',
			'filter': suit.fixAssetsFilter
		});

	var c = {
		element: card,
		value: value,
		suit: suit
	};
	card.data('card', c);
	return c;
}

/**
 * Creates a 'special' card of the given type.
 * @param  {SPECIAL} special Card type definitition from the SPECIAL table.
 * @return {Card}
 */
function createSpecialCard(special) {
	var smallImg = 'solitaire/small_icons/' + special.small + '.png';
	var largeImg = 'solitaire/large_icons/' + special.large + '.png';
	var card = $('<div class="card card-special card-' + special.equivalentSuit + '">' +
		'<div class="card-logo-a"></div>' +
		'<div class="card-logo-b"></div>' +
		'<div class="card-logo"></div>' +
		'</div>');

	card.find('.card-logo-a,.card-logo-b')
		.css({
			'background-image': 'url(' + smallImg + ')',
			'filter': special.fixAssetsFilter
		});
	card.find('.card-logo')
		.css({
			'background-image': 'url(' + largeImg + ')',
			'filter': special.fixAssetsFilter
		});

	var c = {
		element: card,
		special: special
	};
	card.data('card', c);
	return c;
}

/**
 * Places a card at the given level on the given slot.
 * @param {Card} card  The card to place.
 * @param {Subslot} slot  The destination slot
 * @param {Integer} depth How high up the card is. Higher values are further up the stack. When fanned out, higher values are displayed closer to the bottom.
 */
function insertCard(card, slot, depth) {
	if (card.slot !== undefined) {
		card.slot.cards.splice(card.slot.cards.indexOf(card), 1); // remove the card from the previous slot
	}
	// add the card to a new slot.
	slot.cards.splice(depth, 0, card);
	card.slot = slot;

	var e = $(slot.element);

	var ce = card.element.detach();
	if (depth === 0) {
		e.prepend(ce);
	} else {
		var target = e.find('.card:nth-child(' + depth + ')');
		if (target.length !== 0) {
			target.after(ce);
		} else {
			e.append(ce);
		}
	}

	var h = 0;
	if (slot.fan === true) {
		h = depth * CARD_STACK_GAP;
	}
	card.element.css({
		'top': h + 'px',
		'left': 0
	});
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 * @param {Array[?]} array Array to shuffle in-place
 */
function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

/**
 * Creates the elements for the slots, and prepares them to accept cards.
 * @param  {SLOTS} slots The SLOTS object, a set of arrays, each containing slots.
 * @param  {HTMLElement} board The element slots are parented to.
 */
function populateSlots(slots, board) {
	// Create the slots
	for (var slotname in slots) {
		if (slots.hasOwnProperty(slotname)) {
			var list = slots[slotname];
			for (var i = 0; i < list.length; i++) {
				var slot = $('<div class="slot"></div>').css({
					top: list[i].top,
					left: list[i].left
				}).addClass('slot-' + list[i].type);
				if (list[i].height !== undefined) {
					slot.css('height', list[i].height);
				}
				slot.appendTo(board);
				list[i].cards = [];
				list[i].element = slot;
				slot.data('slot', list[i]);
			}
		}
	}
}

/**
 * Creates all the cards in a full deck.
 * @return {Array[Card]} 
 */
function makeDeck() {
	var cards = [];
	var s; // 0-2 suit index.
	var suit; // the actual suit object
	for (var value = 1; value <= 9; value++) {
		for (s = 0; s < 3; s++) {
			switch (s) {
				case 0:
					suit = SUITS.BAMBOO;
					break;
				case 1:
					suit = SUITS.CHARACTERS;
					break;
				case 2:
					suit = SUITS.COINS;
					break;
			}
			cards.push(createCard(value, suit));
		}
	}

	for (s = 0; s < 3; s++) {
		for (var i = 0; i < DRAGON_COUNT; i++) {
			switch (s) {
				case 0:
					suit = SPECIAL.DRAGON_GREEN;
					break;
				case 1:
					suit = SPECIAL.DRAGON_WHITE;
					break;
				case 2:
					suit = SPECIAL.DRAGON_RED;
					break;
			}
			cards.push(createSpecialCard(suit));
		}
	}

	cards.push(createSpecialCard(SPECIAL.FLOWER));
	return cards;
}

/**
 * Places the given cards onto the given board in a top-to-bottom, left-to-right fashion.
 * @param  {Array[Card]} cards   List of cards to place
 * @param  {HTMLElement} board   Parent element for the cards.
 * @param  {SLOT} traySet An array of individual slots, (ex: SLOTS.TRAY)
 */
function placeCardsInTray(cards, board, traySet) {
	var row = 0;
	var col = 0;
	for (var i = 0; i < cards.length; i++) {
		var card = cards[i];
		card.element.appendTo(board);
		insertCard(card, traySet[col], row);

		row++;
		if (row >= 5) {
			row = 0;
			col++;
		}
	}
	onFieldUpdated();
}

/**
 * Makes sure there are no vertical gaps between cards in the tray, by moving them towards the top to fill the gap.
 */
function balanceCards() {
	for (var i = 0; i < SLOTS.TRAY.length; i++) {
		for (var y = 0; y < SLOTS.TRAY[i].cards.length; y++) {
			insertCard(SLOTS.TRAY[i].cards[y], SLOTS.TRAY[i], y);
		}
	}
}

/**
 * Gets all special cards of the given type.
 * @param  {SPECIAL} type
 * @return {Array[Card]}
 */
function getSpecialCards(type) {
	var list = [];
	for (var slotName in SLOTS) {
		if (SLOTS.hasOwnProperty(slotName)) {
			for (var i = 0; i < SLOTS[slotName].length; i++) {
				var stack = SLOTS[slotName][i].cards;
				for (var j = 0; j < stack.length; j++) {
					var card = stack[j];
					if (card.special == type) {
						list.push(card);
					}
				}
			}
		}
	}

	return list;
}

/**
 * Gets all special cards of the given type which are on the top of their respective stack.
 * @param  {SPECIAL} type
 * @return {Array[Card]}
 */
function getTopSpecialCards(type) {
	var list = [];
	for (var slotName in SLOTS) {
		if (SLOTS.hasOwnProperty(slotName)) {
			for (var i = 0; i < SLOTS[slotName].length; i++) {
				var stack = SLOTS[slotName][i].cards;
				if (stack.length === 0) {
					continue;
				}
				var card = stack[stack.length - 1];
				if (card.special == type) {
					list.push(card);
				}
			}
		}
	}

	return list;
}

/**
 * Gets the card with the given value and suit, if any.
 * @param  {Integer} value Card value
 * @param  {SUIT} suit  Card suit
 * @return {Card}       The found card, or undefined.
 */
function getCard(value, suit) {
	for (var slotName in SLOTS) {
		if (SLOTS.hasOwnProperty(slotName)) {
			for (var i = 0; i < SLOTS[slotName].length; i++) {
				var stack = SLOTS[slotName][i].cards;
				for (var j = 0; j < stack.length; j++) {
					if (stack[j].value === value && stack[j].suit == suit) {
						return stack[j];
					}
				}
			}
		}
	}
}

/**
 * Gets whether the dragons of the given type are all on the top of their respective stack, and a slot is open for them to go to.
 * @param  {SPECIAL}  type 
 * @return {Boolean}  Whether all dragon cards of that type are able to be moved, and there is an open slot.
 */
function isDragonReady(type) {
	if (!DEBUG) {
		var allAvailable = getTopSpecialCards(type).length == DRAGON_COUNT;
		var spaceOpen = false;

		for (var i = 0; i < SLOTS.SPARE.length; i++) {
			if (SLOTS.SPARE[i].cards.length === 0 || SLOTS.SPARE[i].cards[0].special === type) {
				spaceOpen = true;
			}
		}

		return allAvailable && spaceOpen;
	} else {
		return true;
	}
}

var DRAGON_BTNS = [{
	type: SPECIAL.DRAGON_RED,
	selector: '#btn_dragon_red',
	imgNone: 'solitaire/button_red_up.png',
	imgReady: 'solitaire/button_red_active.png',
	imgComplete: 'solitaire/button_red_down.png',
},
{
	type: SPECIAL.DRAGON_GREEN,
	selector: '#btn_dragon_green',
	imgNone: 'solitaire/button_green_up.png',
	imgReady: 'solitaire/button_green_active.png',
	imgComplete: 'solitaire/button_green_down.png',
},
{
	type: SPECIAL.DRAGON_WHITE,
	selector: '#btn_dragon_white',
	imgNone: 'solitaire/button_white_up.png',
	imgReady: 'solitaire/button_white_active.png',
	imgComplete: 'solitaire/button_white_down.png',
}
];

/**
 * To be called when cards are done moving. Handles setting up the UI for dragons, etc.
 */
function onFieldUpdated() {
	var i;
	// prepare buttons if dragons are available
	for (i = 0; i < DRAGON_BTNS.length; i++) {
		var btn = DRAGON_BTNS[i];
		if ($(btn.selector).data('complete') !== true) {
			if (isDragonReady(btn.type)) {
				$(btn.selector).css('background-image', 'url(\'' + btn.imgReady + '\')').data('active', true);
			} else {
				$(btn.selector).css('background-image', 'url(\'' + btn.imgNone + '\')').data('active', false);
			}
		}
	}

	// move cards to the out tray when possible.
	// it is movable when there are no cards that can be placed on that card, and the destination is 1 less than this card.
	// this means that, for a BAMBOO 5, there must be no 4s anywhere in the tray or spare slots.

	// build a list of cards which are on the top of their stacks, and are potentially eligible to be automatically moved.
	var movableTops = [];
	var cards;
	var card;
	for (i = 0; i < SLOTS.TRAY.length; i++) {
		cards = SLOTS.TRAY[i].cards;
		if (cards.length > 0) {
			card = cards[cards.length - 1];
			if (card.value || card.special === SPECIAL.FLOWER) {
				movableTops.push(card);
			}
		}
	}
	for (i = 0; i < SLOTS.SPARE.length; i++) {
		cards = SLOTS.SPARE[i].cards;
		if (cards.length > 0) {
			card = cards[cards.length - 1];
			if (card.value || card.special === SPECIAL.FLOWER) {
				movableTops.push(card);
			}
		}
	}

	for (i = 0; i < movableTops.length; i++) {
		var canOut = true;
		var outSlot = undefined;
		var cardAbove = undefined;

		card = movableTops[i];
		if (card.special == SPECIAL.FLOWER) {
			// flower can always move to flower slot.
			outSlot = SLOTS.FLOWER[0];
		} else if (card.value > 2) {
			// output only if all cards with -1 value are in the out tray.
			for (var suit in SUITS) {
				cardAbove = getCard(card.value - 1, SUITS[suit]);
				if (cardAbove) {
					if (cardAbove.slot.type != 'out') {
						canOut = false;
						break;
					} else {
						// card-1 is in the out slot, save that location.
						if (cardAbove.suit == card.suit) {
							outSlot = cardAbove.slot;
						}
					}
				}
			}
		} else if (card.value === 2) {
			// output only if the '1' valued card with same suit is in the out tray.
			cardAbove = getCard(1, card.suit);
			if (cardAbove) {
				if (cardAbove.slot.type != 'out') {
					canOut = false;
				} else {
					outSlot = cardAbove.slot;
				}
			}
		} else {
			// output this '1' valued card to the first empty 'out' slot
			for (var j = 0; j < SLOTS.OUT.length; j++) {
				if (SLOTS.OUT[j].cards.length === 0) {
					outSlot = SLOTS.OUT[j];
					break;
				}
			}
		}

		if (canOut && outSlot) {
			tweenCard(card, outSlot, outSlot.cards.length);
			setTimeout(onFieldUpdated, CARD_ANIMATION_SPEED);
			// don't move any more top cards in this iteration, next will be moved after this card finishes.
			break;
		}
	}

	// no more top cards to move, is the field clear?
	var allGood = true;
	for (i = 0; i < SLOTS.TRAY.length; i++) {
		if (SLOTS.TRAY[i].cards.length !== 0) {
			allGood = false;
			break;
		}
	}

	if (allGood) {
		if (!isInVictory) {
			localStorage.shenzhen_win_count++;
			updateWinCount();
		}
		isInVictory = true;
		// wait for any possible animations to finish.
		setTimeout(function () {
			victoryScreen();
		}, CARD_ANIMATION_SPEED);
	}
}

/**
 * Moves a card to a slot and position, then smoothly animates the transition.
 * @param  {Card}   card     The card to move
 * @param  {SLOT}   slot     The destination slot for the card
 * @param  {Integer}   depth    The position in the slot for the card
 * @param  {Function} callback Called when the animation is complete with the arguments (card, slot, depth)
 */
function tweenCard(card, slot, depth, callback) {
	// remember the original position, move the card to determine the final position, then reset to original and interpolate between them.

	var oldOffset = card.element.offset();
	insertCard(card, slot, depth);
	var newOffset = card.element.offset();

	var dY = newOffset.top - oldOffset.top,
		dX = newOffset.left - oldOffset.left;
	var finalY = parseInt(card.element.css('top')),
		finalX = parseInt(card.element.css('left'));

	card.element.css({
		top: finalY - dY,
		left: finalX - dX,
		'z-index': 99
	});

	card.element.animate({
		top: finalY,
		left: finalX
	}, CARD_ANIMATION_SPEED, 'swing', function () {
		card.element.css('z-index', '');

		if (typeof callback === 'function') {
			callback(card, slot, depth);
		}
	});
}

/**
 * Intended as a parameter for tweenCard.
 * Applies a backing to the card. Also adds special "dragon" backings if the win count is right.
 * @param  {Card} card  The card
 * @param  {SLOT} slot  ignored
 * @param  {Integer} depth ignored
 */
function applyCardBacking(card, _slot, _depth) {
	card.element.addClass('card-reverse');

	// special backing
	if (useLocalStorage) {
		if (localStorage.shenzhen_win_count >= 100) {
			card.element.addClass('grand_dragon');
		}
		if (localStorage.shenzhen_win_count >= 200) {
			card.element.addClass('grand_dragon_2');
		}
	}
}

/**
 * Creates an jQuery action function for a button from DRAGON_BTNS
 * @param  {DRAGON_BTNS element} b The button description
 * @return {Function}
 */
function dragonBtnListener(b) {
	return function () {
		if ($(this).data('active') === true) {
			var i;
			var list = getSpecialCards(b.type);

			var openSlot;
			for (i = 0; i < SLOTS.SPARE.length; i++) {
				var set = SLOTS.SPARE[i].cards;
				// TODO: if any spare slot already has this dragon, go to that one instead.
				if (set.length >= DRAGON_COUNT && set[0].special == b.type) {
					return false;
				}

				if (set.length === 0 || set[0].special == b.type && set.length < DRAGON_COUNT) {
					openSlot = SLOTS.SPARE[i];
					break;
				}
			}

			if (list.length > 0 && openSlot !== undefined) {
				for (i = 0; i < list.length; i++) {
					tweenCard(list[i], openSlot, openSlot.cards.length, applyCardBacking);
				}
				$(b.selector).css('background-image', 'url(\'' + b.imgComplete + '\')').data('complete', true);
				balanceCards();
				onFieldUpdated();
			}
		}
	};
}

/**
 * Creates a function which either highlights or unhighlights dragons as specified by the button.
 * @param  {DRAGON_BTNS item}  b    Button specification
 * @param  {Boolean} isEnter If true, highlights the items. If false, removes the highlights.
 * @return {Function}         The created function
 */
function dragonEnterLeaveListener(b, isEnter) {
	return function () {
		if (dragging) {
			return;
		}
		var cards = getSpecialCards(b.type);

		for (var i = 0; i < cards.length; i++) {
			if (isEnter) {
				$(cards[i].element).addClass('card-highlight');
			} else {
				$(cards[i].element).removeClass('card-highlight');
			}
		}
	};
}

for (var i = 0; i < DRAGON_BTNS.length; i++) {
	var btn = DRAGON_BTNS[i];
	$(btn.selector).click(dragonBtnListener(btn));
	$(btn.selector).mouseenter(dragonEnterLeaveListener(btn, true));
	$(btn.selector).mouseleave(dragonEnterLeaveListener(btn, false));
}

/**
 * Finds whether the given stack is valid to be picked up,
 * IE:
 * If the stack is a single card.
 * OR From the bottom-most card up, each is a numbered card, decreases by in value by 1, and is not the same color as the previous.
 * @param  {Array[Card]} stack A list of cards, with the first element being the "bottom-most" card.
 * @param  {SLOT} sourceSlot The type of slot this comes from
 * @return {Boolean}  Whether the stack can be picked up
 */
function canPickUpStack(stack, sourceSlot) {
	if (sourceSlot.type == 'tray') {
		if (stack.length == 1) {
			return true;
		} else {
			for (var i = 1; i < stack.length; i++) {
				var prev = stack[i - 1],
					curr = stack[i];
				if (prev.value && curr.value && prev.value == curr.value + 1 && prev.suit != curr.suit) {
					continue;
				} else {
					return false;
				}
			}
		}
		return true;
	} else if (sourceSlot.type == 'spare') {
		// once all dragons are stacked in there, you can't move it.
		return sourceSlot.cards.length != DRAGON_COUNT;
	}
}

/**
 * Finds whether the given stack can be put on the given destination.
 * The stack is assumed to be valid to pick up.
 *
 * The destination must be a numbered one. The stack bottom must be numbered, or undefined.
 * The destination must be numbered, one more than the stack bottom, and not the same suit.
 * @param  {Array[Card]} stack The list of cards which are picked up.
 * @param  {SLOT} destSlot
 * @param  {Card} dest  The card which the lowest of the stack will rest upon.
 * @return {Boolean} Whether the stack can be placed on it.
 */
function canPlaceStack(stack, destSlot, dest) {
	if (destSlot.type == 'tray') {
		if (stack.length === 0 || dest === undefined) {
			return true;
		} else {
			if (stack[0].value && dest.value) {
				return (stack[0].value + 1 == dest.value) && (stack[0].suit != dest.suit);
			} else {
				return false;
			}
		}
	} else if (destSlot.type == 'flower') {
		// only flower allowed in flower slot, except during debug
		return stack[0].special === SPECIAL.FLOWER || DEBUG === true;
	} else if (destSlot.type == 'spare') {
		// only 1 card manually placed in spare slot
		return destSlot.cards.length === 0 && stack.length == 1;
	} else if (destSlot.type == 'out') {
		// a single numbered card
		if (stack.length === 1 && stack[0].value) {
			if (dest === undefined) {
				// if empty, must be value '1' card.
				return stack[0].value == 1;
			} else {
				// otherwise, must be the next value
				return stack[0].value == dest.value + 1 && stack[0].suit == dest.suit;
			}
		}
	}
}

/**
 * Sorts the cards in a consistent order.
 * Modifies the given array.
 * @param  {Array[Card]} cards The array of cards to be sorted.
 */
function sortCards(cards) {
	cards.sort(function (a, b) {
		var aHas = typeof a.value !== 'undefined';
		var bHas = typeof b.value !== 'undefined';
		if (aHas && bHas) {
			if (a.value == b.value) {
				return a.suit.order - b.suit.order;
			} else {
				return a.value - b.value;
			}
		} else {
			if (aHas) {
				return -1;
			} else if (bHas) {
				return 1;
			} else {
				return a.special.order - b.special.order;
			}
		}
	});
}

/**
 * Sets up a new game with randomly placed cards.
 * @param  {Array[Card]} cards List of cards which will be placed.
 * @param  {HTMLElement} board The container for the cards.
 * @param  {Object} seed (optional) The random seed for shuffling the deck. If omitted, the time is used.
 */
function startNewGame(cards, board, seed) {
	clearInterval(looper);
	looper = undefined;
	isInVictory = false;

	// TODO: start cards face down in the flower slot, then move them into place.

	sortCards(cards);

	var truSeed = seed;
	// use time-based seed if there is no seed, or is an empty string.
	if (seed === undefined || (typeof seed === 'string' && seed.length === 0)) {
		truSeed = new Date().getTime();
	}
	// if input is a numeric string, convert to an integer ("123" and 123 behave differently)
	if (!isNaN(parseInt(truSeed, 10))) {
		truSeed = parseInt(truSeed, 10);
	}

	currentSeed = truSeed;

	Math.seedrandom(truSeed);

	// eslint-disable-next-line no-console
	console.log('Game id:', truSeed);

	shuffleArray(cards); // shuffle cards

	$('.card').finish().removeClass('card-reverse');
	$('.btn-dragon').data('complete', false);
	placeCardsInTray(cards, board, SLOTS.TRAY); // place cards
	$('.card').visible();
}

function updateWinCount() {
	if (useLocalStorage) {
		$('#win_count').text(localStorage.shenzhen_win_count);
	}
}

/**
 * Whether the victory screen is currently running.
 * @type {Boolean}
 */
var isInVictory = false;
var looper; // the interval identifier for the cards dropping in the victory screen.
/**
 * Runs the victory screen, where cards drop down the screen.
 */
function victoryScreen() {
	var cards = [];

	var stax = $('.slot-spare,.slot-flower,.slot-out');
	var foundThisRun = false;
	do {
		foundThisRun = false;
		for (var i = 0; i < stax.length; i++) {
			var childs = $(stax[i]).children();
			var searchI = $(stax[i]).data('search-i') === undefined ? (childs.length - 1) : $(stax[i]).data('search-i');
			if (searchI >= 0) {
				cards.push(childs[searchI]);
				foundThisRun = true;
				$(stax[i]).data('search-i', searchI - 1);
			}
		}
	} while (foundThisRun);
	stax.removeData('search-i');

	var row = 0;

	// each iteration, over time, take the first card and shunt it down.
	if (looper !== undefined) {
		clearInterval(looper);
	}
	looper = setInterval(function () {
		$(cards[row]).animate({
			top: parseInt($(cards[row]).css('top')) + 1000
		}, 1000);

		row++;
		if (row >= cards.length) {
			clearInterval(looper);
			looper = undefined;
			isInVictory = false;
		}
	}, 50);
}

/**
 * Loads the alternate stylesheet for when the images are missing.
 */
function loadAltStyle() {
	$('head').append('<link rel="stylesheet" type="text/css" href="css/noimages.css">');
}

function setColorblindMode(isColorblindMode) {
	var stylesheetId = 'colorblind-styles';

	if (isColorblindMode) {
		if (!$('#colorblind-styles').length) {
			$('head').append('<link id="' + stylesheetId + '" rel="stylesheet" type="text/css" href="css/colorblind.css">');
		}
	} else {
		$('#' + stylesheetId).remove();
	}

	if (useLocalStorage) {
		localStorage.shenzhen_colorblind = isColorblindMode;
	}
}

/**
 * Creates a stack of all cards including and stacked on top of the given card.
 * @param  {HTMLElement} cardElement The element for the card.
 * @return {Array[Card]}      An array of cards
 */
function getStackFromCardElement(cardElement) {
	var card = $(cardElement).data('card');

	var cardIndex = card.slot.cards.indexOf(card),
		cardLength = card.slot.cards.length;

	var stack = [];
	for (var i = cardIndex; i < cardLength; i++) {
		stack.push(card.slot.cards[i]);
	}

	return stack;
}

var cards;
var dragging = false;
$(document).ready(function () {

	if (useLocalStorage) {
		if (localStorage.shenzhen_win_count === undefined) {
			localStorage.shenzhen_win_count = 0;
		}
	}
	updateWinCount();

	var board = $('#cards');
	populateSlots(SLOTS, board);

	cards = makeDeck();

	// if there is a hash in the url upon load, load that as the seed.
	startNewGame(cards, board, location.hash.replace('#', ''));

	$('#newGame').click(function () {
		// clear the hash from the url.
		history.pushState('', document.title, window.location.pathname + window.location.search);

		startNewGame(cards, board);
	});

	$('#seedGame').click(function () {
		// prompt the user for a seed.
		var seed = prompt('Enter the random seed for this game.');
		if (seed !== null) {
			location.hash = seed;
			startNewGame(cards, board, seed);
		}
	});

	$('#retryGame').click(function () {
		if (currentSeed !== null) {
			location.hash = currentSeed;
			startNewGame(cards, board, currentSeed);
		}
	});

	$('#playMusicButton').click(function() {
		music.play();
		if (music.currentTime > 0 && music.currentTime < 5) {
			music.currentTime = 0;
		}
		$('#playMusicButton').hide();
		$('#pauseMusicButton').show();
	});

	$('#pauseMusicButton').click(function() {
		music.pause();
		$('#playMusicButton').show();
		$('#pauseMusicButton').hide();
	});

	$('#toggleColorblind').change(function (event) {
		setColorblindMode(event.target.checked);
	});

	// When the alt style
	if (useLocalStorage) {
		if (localStorage.shenzhen_colorblind !== undefined && JSON.parse(localStorage.shenzhen_colorblind) === true) {
			$('#toggleColorblind').prop('checked', true);
			setColorblindMode(true);
		}
	}

	// Make the cards interactable
	$('.slot').droppable({
		drop: function (event, ui) {
			// drop is contingent on "accept", so this is a valid stack.
			var stack = getStackFromCardElement(ui.draggable);
			var slot = $(this).data('slot');

			// insert all from stack into the bottom of the slot.
			for (var i = 0; i < stack.length; i++) {
				insertCard(stack[i], slot, slot.cards.length);
			}
			onFieldUpdated();
		},
		accept: function (draggable) {
			var stack = getStackFromCardElement(draggable);
			var slot = $(this).data('slot');

			return canPlaceStack(stack, slot, slot.cards[slot.cards.length - 1]);
		},
		tolerance: 'pointer'
	});

	$('.card').draggable({
		'cursor': 'url(assets/cursor_normal.png) 40 40, default',
		'revert': 'invalid',
		'revertDuration': CARD_ANIMATION_SPEED,
		helper: function () {
			var cardSet = $('<div></div>');
			cardSet.css({
				'z-index': 100,
				'display': 'inline'
			});

			var card = $(this).data('card');
			var cardIndex = card.slot.cards.indexOf(card),
				cardLength = card.slot.cards.length;

			for (var i = cardIndex, height = 0; i < cardLength; i++ , height++) {
				var e = card.slot.cards[i].element.clone();
				e.css({
					top: height * CARD_STACK_GAP,
					left: '',
				});
				cardSet.append(e);
			}
			return cardSet;
		},
		start: function (event, _ui) {
			var card = $(this).data('card');

			var stack = [];
			var cardIndex = card.slot.cards.indexOf(card),
				cardLength = card.slot.cards.length;
			var i;
			for (i = cardIndex; i < cardLength; i++) {
				stack.push(card.slot.cards[i]);
			}

			if (!card.element.is(':animated') && canPickUpStack(stack, card.slot)) {
				for (i = 0; i < stack.length; i++) {
					stack[i].element.invisible();
				}
				dragging = true;
			} else {
				event.stopPropagation();
				event.stopImmediatePropagation();
				event.preventDefault();
			}
		},
		stop: function (_event, _ui) {
			dragging = false;
			var card = $(this).data('card');

			var cardIndex = card.slot.cards.indexOf(card),
				cardLength = card.slot.cards.length;
			for (var i = cardIndex; i < cardLength; i++) {
				card.slot.cards[i].element.visible();
			}
		}
	});

	// detect failed image load
	var triggeredWarning = false;

	// prepare for a canary check for if we have images
	$('#canary').on('error', function (_data, _handler) {
		if (!triggeredWarning) {
			// eslint-disable-next-line no-console
			console.warn('Couldn\'t load an image from the original game. If you own SHENZHEN I/O, copy the game\'s "Content/textures/solitaire" folder into the "solitaire" directory of the cloned repository.');

			loadAltStyle();
		}
		triggeredWarning = true;
	});

	// start the canary check
	$('#canary').attr('src', 'solitaire/button_red_up.png');

	music = new Audio("solitaire/Solitaire.ogg");
	music.loop = true;
	$(music).on('canplay', function() {
		$('#playMusicButton').show();
		$(music).off('canplay');
	})
	$(music).on('error', function (_data, _handler) {
		console.warn('Couldn\'t load music from the original game. If you own SHENZHEN I/O, copy "Content/music/Solitaire.ogg" from the game into the "solitaire" directory of the cloned repository.');
	});

	$('html').keydown(function () { }); // UI breakpoint for debugging in Chrome

	if (DEBUG_STYLE) {
		loadAltStyle();
	}

});