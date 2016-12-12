
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
					return Circular.template.processCCTemplate(ccattr,ccnode,node);
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
			Circular.log.debug('@template','comment',arg);
			$(arg).each(function() {
 				comment.parentNode.insertBefore(this,comment);
 			});
 			var newcomment = $("<!--@template-origin["+arg+"]-->").get(0);
 			comment.parentNode.insertBefore(newcomment,comment);
			comment.parentNode.removeChild(comment);
						
		},
		'template-origin' : function(comment,arg) {
			// ignore
			return;
		}
	},
	
	//------------------------
	
	processCCTemplate(ccattr,ccnode,node) {
		var $node = $(node);
		var tplsel = ccattr.content.value;
		// include the template if it isnt already
		if (!$node.children('[cc-template-origin="'+tplsel+'"]').length) {
			var $tpl = $(tplsel);
			if ($tpl.length) {
				this.createTranscludeBase($node);
				$node.empty();
				$tpl.clone().appendTo($node)
					.removeAttr('id')
					.removeAttr('cc-template')
					.removeAttr('cc-template-source')
					.attr('cc-template-origin',tplsel);
				$node.removeAttr('cc-template-pending');
			} else {
				Circular.log.warn('@template','processCCTemplate','no such template',tplsel);
				if (!$node.is('[cc-template-pending]')) {
					$node.attr('cc-template-pending','');
				}
			}
		} else {
			Circular.log.debug('@template','processCCTemplate','already included');
		}
	},
	
	createTranscludeBase($node) {
		Circular.log.debug('@template','createTranscludeBase');
		var tbasename = Circular.modules.prefix('cc-transclude-base');
		var tbase 		= $node.attr(tbasename);
		if (!tbase) {
			if ($node.children().length) {
				if (!this.$stack) {
					Circular.log.debug('@template','createTranscludeBase','creating stack');
					Circular.engine.stack('<div id="cc-template-stack">');
					this.$stack = $('#cc-template-stack');
				}
				var $trans = $('<div cc-template-transclude>');
				var transid = Circular.engine.nodeid($trans);
				Circular.engine.stack($trans,this.$stack);
				Circular.log.debug('@template','createTranscludeBase','appending children',transid);
				$node.children().appendTo($trans);
				$node.attr(tbasename,'#'+transid);
			} else {
				$node.attr(tbasename,'#none#');
			}
		}
	}
		
});



