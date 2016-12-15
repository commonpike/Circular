
/* ----------------------
	template
----------------------- */

new CircularModule('template',{

	settings		: {
		insertcss : ['[cc-template-source],[cc-template=""]{ display:none; }']
	},
	
	attributes	: {
	
		'cc-template' : {
			in : function(ccattr,ccnode,node) {
				Circular.log.debug('@template','cc-template.in',node);
				
				if (ccattr.content.value=='') {
					// this is a template source
					Circular.log.debug('@template','cc-template:in','moving empty attr to cc-template-source');
					var tplname = Circular.modules.prefix('cc-template');
					var srcname = Circular.modules.prefix('cc-template-source');
					$(node).removeAttr(tplname).attr(srcname,'');
					return Circular.template.attributes['cc-template-source'].in(ccattr,ccnode,node);
				} else {
					// this asks for a template
					return Circular.template.insert(node,ccattr.content.value);
				}				
				
			}
		},
		'cc-template-source'	: {
			in	: function(ccattr,ccnode,node) {
				var $source = $(node);
				var tplname 	= Circular.modules.prefix('cc-template');
				var pendname 	= Circular.modules.prefix('cc-template-pending');
				$('['+pendname+']').each(function() {
					if ($source.is($(this).attr(tplname))) {
						// you found your template
						Circular.log.debug('@template','cc-template-source:in','found pending template');
						Circular.engine.process(this);
						$(this).removeAttr(pendname);
					}
				});
				// dont process this node
				return false;	
			}
		},
		'cc-template-origin'	: {
			// ignore this attribute
		},
		'cc-template-transclude'	: {
			// ignore this attribute
		},
		'cc-template-pending'	: {
			// ignore this attribute
		}
		
	},
	
	comments : {
		'template'	: function(comment,arg) {
			Circular.log.debug('@template','cc:template',arg);
			Circular.template.replace(comment,arg);
		}
	},
	
	//------------------------
	
	create	: function(node) {
		// not used internally
		var $stack = this.getStack();
		var $node = $(node);
		Circular.engine.nodeid(node);
		$node.attr('cc-template-source','');
		Circular.engine.stack($wrap,$stack);
		return $wrap;
	},
	
	insert	: function(node,sel) {
		// include the template if it isnt already
		var $node = $(node);
		if (!$node.children('[cc-template-origin="'+sel+'"]').length) {
			var $tpl = $(sel);
			if ($tpl.length) {
				this.createTranscludeBase($node);
				$node.empty();
				$tpl.clone().appendTo($node)
					.removeAttr('id')
					.removeAttr('cc-template')
					.removeAttr('cc-template-source')
					.attr('cc-template-origin',sel);
				$node.removeAttr('cc-template-pending');
			} else {
				Circular.log.warn('@template','processCCTemplate','no such template',sel);
				if (!$node.is('[cc-template-pending]')) {
					$node.attr('cc-template-pending','');
				}
			}
		} else {
			Circular.log.debug('@template','processCCTemplate','already included');
		}
	},
	
	
	replace	: function(node,sel) {
		var $tpl = $(sel);
		if ($tpl.length) {
			$tpl.each(function() {
				var $clone = $(this).clone()
					.removeAttr('id')
					.removeAttr('cc-template')
					.removeAttr('cc-template-source');
				$clone.attr('cc-template-origin',sel);
				var clone = $clone.get(0);
				node.parentNode.insertBefore(clone,node);
				// process it right away - works without, too
				Circular.engine.process(clone);
			});		
			node.parentNode.removeChild(node);
		} else {
			Circular.log.error('@template','cc:template','no such template',sel);
		}
	},
	
	
	//------------------------

	
	createTranscludeBase($node) {
		var tbasename = Circular.modules.prefix('cc-transclude-base');
		var tbase 		= $node.attr(tbasename);
		if (!tbase) {
			if ($node.children().length) {
				Circular.log.debug('@template','createTranscludeBase');
				var $stack = this.getStack();
				var $trans = $('<div cc-template-transclude>');
				var transid = Circular.engine.nodeid($trans);
				Circular.engine.stack($trans,$stack);
				Circular.log.debug('@template','createTranscludeBase','appending children',transid);
				$node.children().appendTo($trans);
				$node.attr(tbasename,'#'+transid);
			} else {
				$node.attr(tbasename,'#none#');
			}
		}
	},
	
	getStack	: function() {
		if (!this.$stack) {
			Circular.log.debug('@template','getStack','creating stack');
			Circular.engine.stack('<div id="cc-template-stack">');
			this.$stack = $('#cc-template-stack');
		}
		return this.$stack;
	}
		
});



