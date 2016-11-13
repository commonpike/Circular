
/* ----------------------
	Circular.srcbox
----------------------- */


			
new CircularModule('srcbox',{

	
	settings		: {
		insertcss	: [
			"dl.srcbox i.reload {position: absolute;  right: 1em; top: 3.5em; font-style: normal; cursor:pointer; } ",
			"dl.srcbox i.reload:before { width : 1em; height : 1em; content: \"\\27F3\" }"
		]
	},
	
	attributes	: {
		'cc-srcbox' : {
			in	: function(ccattr,ccnode,node) {
				Circular.log.debug('cc-srcbox.in',node);
				var $node = $(node);
				var nodeid = Circular.engine.nodeid($node);
				var $srcbox = '\
					<dl class="srcbox">	\
						<dt>output</dt>\
						<dd class="srcbox-output"></dd>\
						<dt>processed</dt>\
						<dd class="srcbox-processed">\
						<i class="reload"></i>\
						<xmp></xmp></dd>\
						<dt>input</dt>\
						<dd class="srcbox-input"><xmp></xmp></dd>\
					</dl>\
				';				
				$node.after($srcbox);
				$srcbox = $node.next(); // we lost it ?
				
				// copy the contents in the output
				// and remove the original node
				$('.srcbox-output',$srcbox).append($node.contents());
				$srcbox.attr('id',$node.attr('id'));
				$node.remove();
				$srcbox.srcbox();
				
				// show unparsed content in input
				var $input = $('.srcbox-input xmp',$srcbox);
				var $output = $('.srcbox-output',$srcbox);
				$input.get(0).textContent=$output.get(0).innerHTML;
				
				// parse the output
				Circular.engine.process($('.srcbox-output',$srcbox));
				
				// show the parsed content in processed
				Circular.srcbox.update('#'+nodeid,true);
				
				return false;
			}
		
		}
	},
	
	update	: function(ref,now) {
		if (!now) {
			// wait for the watchdog to queue changes first
			var timeout = Circular.watchdog.config.timeout*2;
			if (Circular.watchdog.settings.emulated) {
				timeout += Circular.watchdog.config.muinterval;
			}
			setTimeout(function() {
				Circular.queue.add(function() {
					Circular.srcbox.update(ref,true);
				})
			},timeout);
		} else {
			if (!ref) ref = 'dl.srcbox';
			var $srcbox = $(ref);
			$srcbox.each(function() {
				var $processed = $('.srcbox-processed xmp',this);
				var $output = $('.srcbox-output',this);
				$processed.get(0).textContent=$output.get(0).innerHTML;
			});
		}
	}
	
		
});


(function ( $ ) {
 
	$.fn.srcbox = function() {
		
		// should probably use a nice plugin for these
		
		$this=$(this);
		$this.css({
			'position':'relative',
			'width':'100%',
			'padding-top':'3em'
		});
		var $tabs = $("dt",$this);
		$tabs.each(function(idx) {
			$(this).css({
				'position':'absolute',
				'top':0,'z-index':2,
				'left':idx*(100/$tabs.size())+'%',
				'width':100/$tabs.size()+'%',
				'height':'3em',
				'cursor':'pointer'
			}).click(function() {
				$(this).siblings('dt').removeClass('current');
				$(this).siblings('dd').removeClass('current').hide();
				$(this).addClass('current').next().addClass('current').show();
			});
		});
		$("dd",$this).css({
			'margin-left'	: 0
		}).hide();
		$("dt:first",$this).addClass('current');
		$("dd:first",$this).addClass('current').show(); 
			
		$("dt:eq(1),i.reload",$this).click(function() {
			Circular.srcbox.update('#'+$this.attr('id'),true);
		});

	}
 
}( jQuery ));
