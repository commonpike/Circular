
/* ----------------------
	input
----------------------- */

new CircularModule('input',{

	config	: {
		events 	: [],
		types		: {
			'raw'			: function(val) { return val; },
			'string'	: function(val) { 
				if (val===undefined) return '';
				if (val===null) return '';
				return String(val); 
			},
			'number'	: function(val) { return Number(val); },
			'boolean'	: function(val) { return Circular.parser.boolish(val); }
		}
	},
	
	attributes	: {
	
		'cc-input' : {
			in : function(ccattr,ccnode,node) {
				Circular.log.debug('@input','cc-input.in',node);
				Circular.input.processCCInput(ccattr,ccnode,node);		
				
			},
			insert	: function(ccattr,ccnode,node) {
				Circular.log.debug('@input','attributes.cc-input.insert','ignore');
				
			}	
		},
		'cc-input-event'	: {
			// watch but ignore
		},
		'cc-input-value'	: {
			// watch but ignore
		},
		'cc-input-target'	: {
			// just for checkboxes; ignore
		},
		'cc-input-type'	: {
			// watch but ignore
		}
		
	},
	
	init	: function() {
		this.config.events.reverse().forEach(function(event) {
			Circular.input.events.unshift(event);
		});	
	},
	
	// ----------
	
	events : [
		{ match : 'input[type=radio]', 		event : 'click' },
		{ match : 'input[type=checkbox]', event : 'click' },
		{ match : 'input[type=button]', 	event : 'click' },
		{ match : 'input,textarea', 			event : 'keyup:500' },
		{ match : 'button', 							event : 'click' },
		{ match : 'select', 							event : 'change' },
		{ match : '*',										event : 'click' }
	],
	
	
	
	processCCInput	: function(ccattr,ccnode,node) {
		var $node = $(node);
		var evdata 	= this.getEventData(ccattr,ccnode,node);
		var inpval	= this.getInputValue(ccattr,ccnode);
		var target	= this.getTarget(ccattr,ccnode,node);
		var type		= this.getInputType(ccattr,ccnode,target);
		if (target!==false) {
			if (inpval || $node.is(':input')) {
			
				// set the current value
				this.read($node,target,type);
				
				// set the event
				$node.off('.ccinput');
				var evtimer = null;
				$node.on(evdata.event, function(ev) {
					clearTimeout(evtimer);
					evtimer = setTimeout(function() {
						Circular.input.write(target,$node,inpval,type);
					},evdata.timeout);
				});
				
			} else {
				Circular.log.error('@input','processCCInput','node is not a form element, and no cc-input-value set',node);
			}
		} else {
			Circular.log.error('@input','processCCInput','target is not defined by cc-input, name or id',node);
		}
	},
	
	getEventData	: function(cattr,ccnode,node) {
		
		var evdata = [];
		if (ccnode.attributes['cc-input-event']) {
			var edarr = ccnode.attributes['cc-input-event'].content.value.split(':');
			evdata = { 
				event: edarr[0]+'.ccinput', 
				timeout : edarr[1] || 0 
			};
		} else {
			var $node = $(node);
			for (var mc=0; mc < this.events.length; mc++ ) {
				if ($node.is(this.events[mc].match)) {
					var edarr = this.events[mc].event.split(':');
					evdata = { 
						event: edarr[0]+'.ccinput', 
						timeout : edarr[1] || 0 
					};
					break;
				}
			}
		}
		Circular.log.debug('@input','getEventData',node,evdata);
		return evdata;
	},
	
	getInputValue	: function(cattr,ccnode) {
		var inpval;
		if (ccnode.attributes['cc-input-value']) {
			inpval = ccnode.attributes['cc-input-value'].content.value;
		} 
		// may be undefined;
		return inpval;
	},
	
	getInputType	: function(cattr,ccnode,target) {
		var type;
		if (ccnode.attributes['cc-input-type']) {
			type = ccnode.attributes['cc-input-type'].content.value;
		} else {
			var tgttype = typeof Circular.parser.eval(target);
			if (this.config.types[tgttype]) type=tgttype;
			else type='string';
		}
		return type;
	},
	
	getTarget	: function(ccattr,ccnode,node) {
		var target=false;
		if (ccattr.content.expression) {
			target = ccattr.content.expression;
			Circular.log.debug('@input','getTarget','expression',target);
		} else if (ccattr.content.value) {
			target = ccattr.content.value;
			Circular.log.debug('@input','getTarget','value',target);
		} else {
			var $node = $(node);
			part = $node.attr('name');
			if (!part) part = $node.attr('id');
			if (part) {
				//target = Circular.context.get()+'["'+part+'"]';
				target = Circular.context.get()+'.'+part;
				Circular.log.debug('@input','getTarget','induced',target);
				Circular.queue.add(function() {
					$node.attr('cc-input','{{'+target+'}}');
				});
			}
		}
		if ($(node).is('input[type=checkbox]')) {
			// save this so we can find those later
			$(node).attr('cc-input-target',target);
		}
		// may be undefined;
		return target;
	},
	
	map		: function(val,type) {
		return this.config.types[type](val);
	},
	
	read	: function($node,target,type) {
	
		var value 	= Circular.parser.eval(target);
		
		Circular.log.debug('@input','read',$node,target,value,type);
		
		if ($node.is(':input')) {
			if ($node.is('input[type=checkbox]')) {
				if (Array.isArray(value)) {
					if (value.indexOf(this.map($node.val(),type))!=-1) {
						$node.attr('checked','');
					}
				} else {
					if (value) {
						Circular.log.warn('@input','read','checkbox does not refer to an array');
					}
				}
			} else if ($node.is('input[type=radio]')) {
				if (this.map($node.val(),type)===value) {
					$node.attr('checked','');
				}
			} else if ($node.is('select[multiple]')) {
				if (Array.isArray(value)) {
					$node.val(value); // should we map stuff ?
				} else {
					if (value) {
						Circular.log.warn('@input','read','multiple select does not refer to an array');
					}
				}
			} else {
				
				$node.val(this.map(value,type));
			}
		} else {
			Circular.log.debug('@input','read','not an input, not reading');
		}
	},
	
	write	: function(target,$node,value,type) {
		Circular.log.debug('@input','write',target,$node,value,type);
		var valexp = '""';
		if (value!==undefined) {
			value = this.map(value,type);
		} else {
			if ($node.is(':input')) {
				
				if ($node.is('[type=checkbox]')) {
					var name = $node.attr('name');
					var $all = $('input[type="checkbox"][cc-input-target="'+target+'"]',$node.get(0).form);
					var value = [];
					$all.each(function() {
						if (this.checked) {
							value.push(Circular.input.map($(this).val(),type));
						}
					});
					
				} else if ($node.is('input[type=radio]')) {
					if ($node.is(':checked')) {
						value = this.map($node.val(),type);
					}

				} else if ($node.is('select[multiple]')) {
					value = [];
					var arr = $node.val();
					if (arr) {
						arr.forEach(function(elm) {
							value.push(Circular.input.map(elm,type));
						});
					} 
				}  else {
					value = this.map($node.val(),type);
				}
				Circular.log.debug('@input','write',target,value);
				
			} else {
				Circular.log.debug('@input','write','no value, no input, not writing');
				return false;
			}
		} 
		
		Circular.parser.eval(target+'='+JSON.stringify(value));
		return true;
		
	}
		
});



