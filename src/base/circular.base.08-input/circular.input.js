
/* ----------------------
	input
----------------------- */

new CircularModule('input',{

	config	: {
		events 	: [],
		types		: {}
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
		'cc-input-dir'	: {
			// watch but ignore
		},
		'cc-input-event'	: {
			// watch but ignore
		},
		'cc-input-value'	: {
			// watch but ignore
		},
		'cc-input-type'	: {
			// watch but ignore
		}
		
	},
	
	init	: function() {
		this.config.events.reverse().forEach(function(event) {
			Circular.input.events.unshift(event);
		});	
		for (var type in this.config.types) {
			this.addType(type,this.config.types[type]);
		}
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
	
	mapping	: {
		'raw'			: function(val) { return val; },
		'string'	: function(val) { 
			if (val===undefined) return '';
			if (val===null) return '';
			return String(val); 
		},
		'number'	: function(val) { 
			return Number(val); 
		},
		'boolean'	: function(val) { 
			return Circular.parser.boolish(val); 
		}
	},
	
	addType	: function(name,func) {
		this.mapping[name]=func;
	},
	
	processCCInput	: function(ccattr,ccnode,node) {
		var $node = $(node);
		var inpdir 	= this.getInputDir(ccattr,ccnode,node);
		var evdata 	= this.getEventData(ccattr,ccnode,node);
		var inpval	= this.getInputValue(ccattr,ccnode);
		var oldval	= ccattr.content.mapped;
		var target	= this.getTarget(ccattr,ccnode,node);
		var type		= this.getInputType(ccattr,ccnode,target);
		if (target!==false) {
			if (inpval || $node.is(':input')) {
			
				if (inpdir.read) {
					// set the current value
					var mapped = this.read($node,target,oldval,type);
					if (mapped) {
						ccattr.content.mapped = mapped;
					}
				}
				
				if (inpdir.write) {
					// set the event
					$node.off('.ccinput');
					var evtimer = null;
					$node.on(evdata.event, function(ev) {
						clearTimeout(evtimer);
						evtimer = setTimeout(function() {
							var mapped = Circular.input.write(target,$node,inpval,type);
							if (mapped) {
								Circular.queue.add(function() {
									var ccnode = Circular.registry.get(node);
									ccnode.attributes[ccattr.properties.name].content.mapped=mapped;
								});
							}
						},evdata.timeout);
					});
				}
				
			} else {
				Circular.log.error('@input','processCCInput','node is not a form element, and no cc-input-value set',node);
			}
		} else {
			Circular.log.error('@input','processCCInput','target is not defined by cc-input, name or id',node);
		}
	},
	
	getInputDir	: function(cattr,ccnode,node) {
		
		var inpdir = {};
		if (ccnode.attributes['cc-input-dir']) {
			inpdir = { 
				read	: ccnode.attributes['cc-input-dir'].content.value=='read',
				write	: ccnode.attributes['cc-input-dir'].content.value=='write'
			};
		} else {
			inpdir = { read:true, write: true }
		}
		return inpdir;
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
			if (this.mapping[tgttype]) type=tgttype;
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
			// make sure this has the right formatting
			// to find this later with css
			if ($(node).attr('cc-input')!=target) {
				$(node).attr('cc-input',target);
			}
		}
		// may be undefined;
		return target;
	},
	
	map		: function(val,type) {
		if (Array.isArray(val)) {
			var arr = val.slice(0);
			arr.forEach(function(item,idx) {
				arr[idx]=Circular.input.map(item,type);
			});
			return arr;
		} else {
			return this.mapping[type](val);
		}
	},
	
	read	: function($node,target,oldval,type) {
		Circular.log.debug('@input','read',$node,target,type);
		
		if ($node.is(':input')) {
			var value 	= Circular.parser.eval(target);
			var mapped 	= this.map(value,type);
			
			if (mapped!==oldval) {
				if ($node.is('input[type=checkbox]')) {
					if (Array.isArray(mapped)) {
						if (mapped.indexOf(this.map($node.val(),type))!=-1) {
							$node.prop('checked',true);
						} else {
							$node.prop('checked',false);
						}
					} else {
						// single checkbox can target a scalar
						if (this.map($node.val(),type)===mapped) {
							$node.prop('checked',true);
						} else {
							$node.prop('checked',false);
						}
					}
				} else if ($node.is('input[type=radio]')) {
					if (this.map($node.val(),type)===mapped) {
						$node.prop('checked',true);
					} else {
						$node.prop('checked',false);
					}
				} else if ($node.is('select[multiple]')) {
					if (Array.isArray(value)) {
						$node.val(mapped); 
					} else {
						$node.val([]);
						if (mapped) {
							Circular.log.warn('@input','read','multiple select does not refer to an array');
						}
					}
				} else {
					
					$node.val(mapped);
				}
				
				// if the target was yet undefined, set it to
				// the mapping of undefined instead
				if (value===undefined) {
					Circular.parser.eval(target+'='+JSON.stringify(mapped));
				}
				
				return mapped;
				
			} else {
				Circular.log.debug('@input','read','mapped value did not change');
			}
			
		} else {
			Circular.log.debug('@input','read','not an input, not reading');
		}
		
		return false;
	},
	
	write	: function(target,$node,inpval,type) {
	
		var mapped;
		
		Circular.log.debug('@input','write',target,$node,inpval,type);
		if (inpval!==undefined) {
		
			// the value was given using cc-input-value
			mapped = this.map(inpval,type);
			
		} else {
		
			// read the value from the element
			if ($node.is(':input')) {
				
				if ($node.is('[type=checkbox]')) {
					var name = $node.attr('name');
					var $all = $('input[type="checkbox"][cc-input="'+target+'"]',$node.get(0).form);
					if ($all.length>1) {
						var arr = [];
						$all.each(function() {
							if (this.checked) {
								arr.push($(this).val());
							}
						});
						mapped = this.map(arr,type);
					} else {
						// single checkbox should target a scalar
						mapped = this.map($all.eq(0).val(),type);
					}
					
				} else if ($node.is('input[type=radio]')) {
					if ($node.is(':checked')) {
						mapped = this.map($node.val(),type);
					}

				} else {
					mapped = this.map($node.val(),type);
				}
				Circular.log.debug('@input','write',target,mapped);
				
			} else {
				Circular.log.debug('@input','write','no value, no input, not writing');
				return false;
			}
		} 
		
		Circular.parser.eval(target+'='+this.stringify(mapped));
		return mapped;
		
	},
	
	stringify	: function(value) {
		if (isNaN(value) && typeof value=='number') return 'NaN';
		return JSON.stringify(value)
	}
		
});



