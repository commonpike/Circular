
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
			Circular.input.addEvent(event);
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
	
	addEvent	: function(definition) {
		Circular.input.events.unshift(definition);
	},
	
	types	: {
		'raw'			: {
			equals	: function(a,b) { return a === b; },
			map : function(val) { return val; }
		},
		'string'	: {
			equals	: function(a,b) { return a === b; },
			map : function(val) { 
				if (val===undefined) return '';
				if (val===null) return '';
				return String(val); 
			}
		},
		'number'	: {
			equals	: function(a,b) { 
				if (isNaN(a) && isNaN(b)) return true;
				return a === b; 
			},
			map : function(val) { 
				return Number(val); 
			}
		},
		'boolean'	: {
			config	:{
				false : ['no','off','false','0'], 
				true 	: ['yes','on','true','1']
			},
			equals	: function(a,b) { return a === b; },
			map : function(val) { 
				if (this.config[false].indexOf(val)!=-1) return false;
				if (this.config[true].indexOf(val)!=-1) return true;
				return Boolean(val);
			}
		}
	},
	
	addType	: function(name,definition) {
		this.mapping[name]=definition;
	},
	
	map		: function(val,type) {
		if (Array.isArray(val)) {
			var arr = val.slice(0);
			arr.forEach(function(item,idx) {
				arr[idx]=Circular.input.map(item,type);
			});
			return arr;
		} else {
			return this.types[type].map(val);
		}
	},
	
	processCCInput	: function(ccattr,ccnode,node) {
		var $node = $(node);
		var inpdir 	= this.getInputDir(ccattr,ccnode,node);
		var evdata 	= this.getEventData(ccattr,ccnode,node);
		var inpval	= this.getInputValue(ccattr,ccnode);
		var target	= this.getTarget(ccattr,ccnode,node);
		var type		= this.getInputType(ccattr,ccnode,target);
		if (target!==false) {
			if (inpval || $node.is(':input')) {
			
				if (inpdir.read) {
					// set the current value
					this.read($node,target,type);
				}
				
				if (inpdir.write) {
					// set the event
					$node.off('.ccinput');
					var evtimer = null;
					$node.on(evdata.event, function(ev) {
						clearTimeout(evtimer);
						evtimer = setTimeout(function() {
							Circular.input.write(target,$node,inpval,type);
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
	
	getInputValue	: function($node,ccnode) {
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
			if (this.types[tgttype]) type=tgttype;
			else type='string';
		}
		return type;
	},
	
	getTarget	: function(ccattr,ccnode,node) {
		var target;
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
			// right away to find this later with css
			if ($(node).attr('cc-input')!='{{'+target+'}}') {
				$(node).attr('cc-input','{{'+target+'}}');
			}
		}
		// may be undefined;
		return target;
	},
	
	
	
	read	: function($node,target,type) {
		Circular.log.debug('@input','read',$node,target,type);
		
		if ($node.is(':input')) {
			var tgtval 			= Circular.parser.eval(target);
			var tgtmapped 	= this.map(tgtval,type);
			var elmval			= $node.val();
			var elmmapped 	= this.map(elmval,type);
			
			if (!this.types[type].equals(tgtmapped,elmmapped)) { 
				
				Circular.log.debug('@input','read','mapped values differ');
				
				if ($node.is('input[type=checkbox]')) {
					if (Array.isArray(tgtmapped)) {
						//console.log('checkr multi',elmmapped,tgtmapped);
						if (tgtmapped.indexOf(elmmapped)!=-1) {
							$node.prop('checked',true);
						} else {
							$node.prop('checked',false);
						}
					} else {
						// single checkbox can target a scalar
						// console.log('checkr single',elmmapped,tgtmapped);
						$node.prop('checked',false);
						
					}
				} else if ($node.is('input[type=radio]')) {
					
					$node.prop('checked',false);
					
				} else if ($node.is('select[multiple]')) {
					if (Array.isArray(tgtmapped)) {
						$('option',$node).each(function() {
							var $this = $(this);
							var elmmapped = Circular.input.map($this.val(),type);
							if (tgtmapped.indexOf(elmmapped)!=-1) {
								$this.prop('selected',true);
							} else {
								$this.prop('selected',false);
							}
						});
					} else {
						$node.val([]);
						if (tgtmapped) {
							Circular.log.warn('@input','read','multiple select does not refer to an array');
						}
					}
				} else {
				
					$node.val(tgtmapped);
				}
				
				
				
			} else {
			
				Circular.log.debug('@input','read','mapped values are equal');
				
				if ($node.is('input[type=checkbox]')) {
					
					// single checkbox can target a scalar
					// console.log('checkr single',elmmapped,tgtmapped);
					$node.prop('checked',true);
					
				} else if ($node.is('input[type=radio]')) {
					
					$node.prop('checked',true);
					
				} 
				
			}

			// now that you figured out the types,
			// if the target was yet undefined, set it to
			// the mapping of undefined instead
			
			if (tgtval===undefined) {
				// console.log('tgtmapped',tgtval,tgtmapped);
				Circular.parser.eval(target+'='+this.stringify(tgtmapped));
			}
			
		} else {
			Circular.log.debug('@input','read','not an input, not reading');
		}
		
		
		
	},
	
	write	: function(target,$node,inpval,type) {
	
		var elmmapped;
		
		Circular.log.debug('@input','write',target,$node,inpval,type);


		if (inpval!==undefined) {
		
			// the value was given using cc-input-value
			elmmapped = this.map(inpval,type);
			
		} else {
		
			// read the value from the element
			if ($node.is(':input')) {
				

				if ($node.is('[type=checkbox]')) {
					// treat it like an array
					var name = $node.attr('name');
					var $all = $('input[type="checkbox"][cc-input="{{'+target+'}}"]',$node.get(0).form);
					if ($all.size()>1) {
						// treat it like an array
						var arr = [];
						$all.each(function() {
							if (this.checked) arr.push($(this).val());
						});
						elmmapped = this.unique(this.map(arr,type));
					} else {
						// single checkbox should target a scalar
						if ($node.is(':checked')) {
							elmmapped = this.map($node.val(),type);
						} else {
							elmmapped = this.map(undefined,type);
						}
					}
					
				} else if ($node.is('input[type=radio]')) {
					if ($node.is(':checked')) {
						elmmapped = this.map($node.val(),type);
					} else {
						elmmapped = this.map(undefined,type);
					}

				} else if ($node.is('select[multiple]')) {
				
					elmmapped = this.unique(this.map($node.val(),type));
				
				} else {
				
					elmmapped = this.map($node.val(),type);
					
				}
				Circular.log.debug('@input','write',target,elmmapped);
				
			} else {
				Circular.log.debug('@input','write','no value, no input, not writing');
				return false;
			}
		} 
		
		Circular.parser.eval(target+'='+this.stringify(elmmapped));
		
	},
	
	stringify	: function(value) {
		// keywords not supported by json:
		// NaN
		if (isNaN(value) && typeof value=='number') return 'NaN';
		// infinity ?
		//
		return JSON.stringify(value)
	},
	
	unique	: function(arr) {
		 return arr.filter(function (e, i, a) {
    		return a.lastIndexOf(e) === i;
		});
	}
	
	
		
});



