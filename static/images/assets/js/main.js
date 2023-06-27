(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper'),
		$main = $('#main'),
		settings = {

			// Keyboard shortcuts.
			keyboardShortcuts: {

				// If true, enables scrolling via keyboard shortcuts.
				enabled: true,

				// Sets the distance to scroll when using the left/right arrow keys.
				distance: 50

			},

			// Scroll wheel.
			scrollWheel: {

				// If true, enables scrolling via the scroll wheel.
				enabled: true,

				// Sets the scroll wheel factor. (Ideally) a value between 0 and 1 (lower = slower scroll, higher = faster scroll).
				factor: 1

			},

			// Scroll zones.
			scrollZones: {

				// If true, enables scrolling via scroll zones on the left/right edges of the screen.
				enabled: true,

				// Sets the speed at which the page scrolls when a scroll zone is active (higher = faster scroll, lower = slower scroll).
				speed: 15

			}

		};

	// Breakpoints.
	breakpoints({
		xlarge:  [ '1281px',  '1680px' ],
		large:   [ '981px',   '1280px' ],
		medium:  [ '737px',   '980px'  ],
		small:   [ '481px',   '736px'  ],
		xsmall:  [ null,      '480px'  ],
	});

	// Tweaks/fixes.

	// Mobile: Revert to native scrolling.
	if (browser.mobile) {

		// Disable all scroll-assist features.
		settings.keyboardShortcuts.enabled = false;
		settings.scrollWheel.enabled = false;
		settings.scrollZones.enabled = false;

		// Re-enable overflow on main.
		$main.css('overflow-x', 'auto');

	}

	// IE: Fix min-height/flexbox.
	if (browser.name == 'ie')
		$wrapper.css('height', '100vh');

	// iOS: Compensate for address bar.
	if (browser.os == 'ios')
		$wrapper.css('min-height', 'calc(100vh - 30px)');

	// Play initial animations on page load.
	$window.on('load', function() {
		window.setTimeout(function() {
			$body.removeClass('is-preload');
		}, 100);
	});

	// Items.

	// Assign a random "delay" class to each thumbnail item.
	$('.item.thumb').each(function() {
		$(this).addClass('delay-' + Math.floor((Math.random() * 6) + 1));
	});

	// IE: Fix thumbnail images.
	if (browser.name == 'ie') {
		$('.item.thumb').each(function() {

			var $this = $(this),
				$img = $this.find('img');

			$this
				.css('background-image', 'url(' + $img.attr('src') + ')')
				.css('background-size', 'cover')
				.css('background-position', 'center');

			$img
				.css('opacity', '0');

		});
	}

	// Poptrox.
	$main.poptrox({
		onPopupOpen: function() { $body.addClass('is-poptrox-visible'); },
		onPopupClose: function() { $body.removeClass('is-poptrox-visible'); },
		overlayColor: '#1a1f2c',
		overlayOpacity: 0.75,
		popupCloserText: '',
		popupLoaderText: '',
		selector: '.item.thumb a.image',
		caption: function($a) {
			return $a.prev('h2').html();
		},
		usePopupDefaultStyling: false,
		usePopupCloser: false,
		usePopupCaption: true,
		usePopupNav: true,
		windowMargin: 50
	});

	breakpoints.on('>small', function() {
		$main[0]._poptrox.windowMargin = 50;
	});

	breakpoints.on('<=small', function() {
		$main[0]._poptrox.windowMargin = 0;
	});

	// Keyboard shortcuts.
	if (settings.keyboardShortcuts.enabled) {
		$window.on('keydown', function(event) {

			var scrolled = false;

			if ($body.hasClass('is-poptrox-visible'))
				return;

			switch (event.keyCode) {

				// Left arrow.
				case 37:
					$main.scrollLeft($main.scrollLeft() - settings.keyboardShortcuts.distance);
					scrolled = true;
					break;

				// Right arrow.
				case 39:
					$main.scrollLeft($main.scrollLeft() + settings.keyboardShortcuts.distance);
					scrolled = true;
					break;

				// Page Up.
				case 33:
					$main.scrollLeft($main.scrollLeft() - $window.width() + 100);
					scrolled = true;
					break;

				// Page Down, Space.
				case 34:
				case 32:
					$main.scrollLeft($main.scrollLeft() + $window.width() - 100);
					scrolled = true;
					break;

				// Home.
				case 36:
					$main.scrollLeft(0);
					scrolled = true;
					break;

				// End.
				case 35:
					$main.scrollLeft($main.width());
					scrolled = true;
					break;

			}

			// Scrolled?
			if (scrolled) {

				// Prevent default.
				event.preventDefault();
				event.stopPropagation();

				// Stop link scroll.
				$main.stop();

			}

		});
	}

	// Scroll wheel.
	if (settings.scrollWheel.enabled) {
		$body.on('wheel', function(event) {

			// Disable on <=small.
			if (breakpoints.active('<=small'))
				return;

			// Prevent default.
			event.preventDefault();
			event.stopPropagation();

			// Stop link scroll.
			$main.stop();

			// Calculate delta, direction.
			var	n = normalizeWheel(event.originalEvent),
				x = (n.pixelX != 0 ? n.pixelX : n.pixelY),
				delta = Math.min(Math.abs(x), 150) * settings.scrollWheel.factor,
				direction = x > 0 ? 1 : -1;

			// Scroll page.
			$main.scrollLeft($main.scrollLeft() + (delta * direction));

		});
	}

	// Scroll zones.
	if (settings.scrollZones.enabled) {
		var	$left = $('<div class="scrollZone left"></div>'),
			$right = $('<div class="scrollZone right"></div>'),
			$zones = $left.add($right),
			paused = false,
			intervalId = null,
			direction,
			activate = function(d) {

				// Disable on <=small.
				if (breakpoints.active('<=small'))
					return;

				// Paused? Bail.
				if (paused)
					return;

				// Stop link scroll.
				$main.stop();

				// Set direction.
				direction = d;

				// Initialize interval.
				clearInterval(intervalId);

				intervalId = setInterval(function() {
					$main.scrollLeft($main.scrollLeft() + (settings.scrollZones.speed * direction));
				}, 25);

			},
			deactivate = function() {

				// Unpause.
				paused = false;

				// Clear interval.
				clearInterval(intervalId);

			};

		$zones
			.appendTo($wrapper)
			.on('mouseleave mousedown', function(event) {
				deactivate();
			});

		$left
			.css('left', '0')
			.on('mouseenter', function(event) {
				activate(-1);
			});

		$right
			.css('right', '0')
			.on('mouseenter', function(event) {
				activate(1);
			});

		$body.on('---pauseScrollZone', function(event) {

			// Pause.
			paused = true;

			// Unpause after delay.
			setTimeout(function() {
				paused = false;
			}, 500);

		});
	}

})(jQuery);
