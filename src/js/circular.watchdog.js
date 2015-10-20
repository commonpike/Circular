

/* ----------------------
	watchdog
----------------------- */

new CircularModule({
		
	name				: 'watchdog',
	requires		: ['log','debug','registry','engine'],
	timer				: null,
	lock				: false,
	config			: {
		watchdogtimeout	: 500
	},
	
	domobserver : null,
	
	pathobservers		: {
	
		// 'full.path' : {
		//		'observer'		: new PathObserver(),
		//		'properties'	:	[
		//			{ 'node': Node, 'type':attribute, 'id':name },
		//			..
		//		]
		//	},
		//  .. 
	
	},
	
	pending	: {
		nodes		: [
			// Node,Node,..
		],
		records	: [
			// {type:type,flag:flag,target:target},
			// {type:pass,flag:attrdatachanged,target:class},..
			// {type:event,flag:attrdatachanged,target:class},..
			// {type:ignore,flag:contextchanged,target:*},..
		]
	},
	
	processing	: {
		// copy of pending on process()
	},
	
	
	
	init	: function() {
		Circular.debug.write('Circular.watchdog.init');
		this.domobserver = new MutationObserver(Circular.watchdog.ondomchange);
	},
	
	die	: function() {
		Circular.debug.write('Circular.watchdog.die');
		this.domobserver.disconnect();
		for (path in this.pathobservers) {
			this.pathobservers[path].observer.close();
		}
		this.pathobservers = {};
	},
	
	watch	: function (node,props) {
		Circular.debug.write('Circular.watchdog.watch');
		this.watchdom(node,props);
		this.watchdata(node,props);
		
	},
	
	
	
	watchdom	: function(node,props) {
		Circular.debug.write('Circular.watchdog.watchdom',props);
		// todo: check if its already watched or changed
		this.domobserver.observe(node, { 
			attributes		: true, 
			childList			: true, 
			characterData	: true,
			subtree				: false
		});
	},
	
	ondomchange	: function(records,observer) {
		Circular.debug.write('Circular.watchdog.ondomchange',records);
		
		//type	String	
		//target	Node	
		//addedNodes	NodeList	
		//removedNodes	NodeList	
		//previousSibling	Node	
		//nextSibling	Node	
		//attributeName	String	
		//attributeNamespace	String	
		//oldValue	String	
		
		records.forEach(function(record) {
			switch(record.type) {
				case 'attributes':
					Circular.watchdog.track(record.target,'event','attrdomchanged',record.attributeName);
					break;
				case 'characterData':
					Circular.watchdog.track(record.target,'event','contentchanged');
					break;
				case 'childList':
					// we have record.addedNodes .. ignoring
					// we have record.removedNodes .. ignoring ?
					Circular.watchdog.track(record.target,'event','contentchanged');
					break;
				default:
					Circular.log.error('Circular.watchdog.ondomchange','unknown record type '+record.type);
			}
		},this);
		
	},
	
	watchdata	: function(node,props) {
		Circular.debug.write('Circular.watchdog.watchdata',props);
		// todo: check if its already watched or changed
		props.attributes.forEach(function(attr,idx) {
			if (attr.paths) {
				attr.paths.forEach(function(path) {
					var object=null,subpath='';
					var split = path.indexOf('.');
					if (split==-1) {
						Circular.log.error('Circular.watchdog.watchdata','observe cannot be called on the global proxy object',path);
					} else {
						object 	= Circular.parser.eval(path.substring(0,split));
						subpath = path.substring(split+1)
					}
					if (object && subpath) {
						var property = {
							'node'		:	node,
							'type'		: 'attribute',
							'id'			: attr.name
						};
						if (!this.pathobservers[path]) {
							if (object !== window) {
								this.pathobservers[path] = {
									'observer'	: new PathObserver(object,subpath),
									'properties': [property]
								};
								this.pathobservers[path].observer.open(function(newvalue,oldvalue) {
									Circular.watchdog.ondatachange(path,newvalue,oldvalue)
								});
							} else {
								Circular.log.error('Circular.watchdog.watchdata','observe cannot be called on the global proxy object',path);
							}
						} else {
							this.pathobservers[path].properties.push(property);
						}
					} else {
						Circular.log.error('Circular.watchdog.watchdata','Cant split path '+path);
					}
				},this);
			}
		},this);
	},
	
	ondatachange	: function(fullpath,newvalue,oldvalue) {
		Circular.debug.write('Circular.watchdog.ondatachange',fullpath);
		this.pathobservers[fullpath].properties.forEach(function(prop) {
			switch (prop.type) {
				case 'attribute':
					this.track(prop.node,'event','attrdatachanged',prop.id);
					break;
				default:
					Circular.log.error('Circular.watchdog.ondatachange','unknown property type '+prop.type);
			}
		},this);
	},
	
	
	
	pass	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.pass');
		this.track(node,'pass',event,target);
	},
	ignore	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.ignore');
		this.track(node,'ignore',event,target);
	},
	unignore	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.unignore');
		// todo: add domchange/datachange timeout
		this.track(node,'unignore',event,target);
	},

	track	: function(node,type,flag,target) {
		Circular.debug.write('Circular.watchdog.track',node,type,flag,target);
		clearTimeout(this.timer);
		
		var nodeidx = this.pending.nodes.indexOf(node);
		if (nodeidx==-1) {
			nodeidx=this.pending.nodes.length;
			this.pending.nodes.push(node);
		}
		if (!this.pending.records[nodeidx]) {
			this.pending.records[nodeidx] = [];
		}
		this.pending.records[nodeidx].push({type:type,flag:flag,target:target});
		
		
		this.timer = setTimeout(function () {
			Circular.engine.queue(function() {
				Circular.watchdog.process();
			});
		}, Circular.config.watchdogtimeout);
		
	},
	
	process	: function() {
	
		Circular.debug.write('Circular.watchdog.process');

		// copy & clean pending to processing
		// read all the records
		// set node properties where needed
		// recycle all nodes involved

		
		if (this.lock) {
			Circular.log.fatal('Circular.watchdog.process','found lock: another process seems to be running');
			return false;
		}
		this.lock = true;
		$.extend(true,this.processing,this.pending);
		this.pending.nodes = [];
		this.pending.records = [];
		
		for (var nc=0;nc<this.processing.nodes.length;nc++) {
			var node			= this.processing.nodes[nc];
			var records 	= this.processing.records[nc];
			var props 		= Circular.registry.get(node);
			
			// {type,flag,target}
			for (var rc=0; rc<records.length;rc++) {
				var record = records[rc];
				var processing = false;
				switch (record.type) {
					case 'event' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (props.name2attr[record.target]) {
									
										if (props.name2attr[record.target].flags[record.flag+':i']) {
											Circular.debug.write('Circular.watchdog.process','attr ignoring flag',record.flag);
											break;
										}
										if (props.name2attr[record.target].flags[record.flag+':p']) {
											Circular.debug.write('Circular.watchdog.process','attr passing flag',record.flag);
											props.name2attr[record.target].flags[record.flag+':p']--;
											break;
										}
										Circular.debug.write('Circular.watchdog.process',record.flag,record.target,node);
										props.name2attr[record.target].flags[record.flag]=true;
										props.flags[record.flag]=true;
										processing=true;
									} else {
										Circular.debug.write('Circular.watchdog.process','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.process','attr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
							
								if (props.flags['contentchanged:i']) {
									Circular.debug.write('Circular.watchdog.process','node ignoring contentchanged');
									break;
								}
								if (props.flags['contentchanged:p']) {
									Circular.debug.write('Circular.watchdog.process','node passing contentchanged');
									props.flags['contentchanged:p']--;
									break;
								}
								Circular.debug.write('Circular.watchdog.process','contentchanged',record,node);
								props.flags['contentchanged']=true;
								processing=true;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.process','unknown flag '+record.flag,record);
						}
						break;
						
					case 'pass' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':p']++;
									} else {
										Circular.debug.write('Circular.watchdog.process','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.process','attr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
								props.flags['contentchanged:p']++;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.process','unknown flag '+record.flag,record);
						}
						break;
						
					case 'ignore' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':i']=true;
									} else {
										Circular.debug.write('Circular.watchdog.process','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.process','attr event target missing ',record);
								}
								break;

							case 'contentchanged':
								props.flags['contentchanged:i']=true;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.process','unknown flag '+record.flag,record);
						}
						break;
						
					case 'unignore' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':i']=false;
									} else {
										Circular.debug.write('Circular.watchdog.process','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.process','attr event target missing ',record);
								}
								break;

							case 'contentchanged':
								props.flags['contentchanged:i']=false;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.process','unknown flag '+record.flag,record);
						}
						break;
						
					default:
						Circular.log.error('Circular.watchdog.process','unknown record type '+record.type,record);
				}
			}
			
			// todo: we're not storing the pass and un/ignore flags ?
			if (!processing) {
				delete this.processing.nodes[nc];
				delete this.processing.records[nc];
			} else {
				Circular.registry.set(node,props);
			}
		};
		
		// make hte array unsparse
		var todo = [];
		this.processing.nodes.forEach(function(node) { todo.push(node); });
		if (todo.length) {
			Circular.debug.write('recycling '+todo.length+' nodes');
			if (Circular.debug.on) this.report(this.processing);
			Circular.engine.recycle(todo,true);
		}
		this.processing = {};
		this.lock = false;
		return true;
	},
	
	report	: function(list) {
		if (!list) list = this.pending;
		Circular.log.write('Circular.watchdog.report');
		list.nodes.forEach(function(node,idx) {
			Circular.log.write(node.tagName,list.records[idx]);
		},this);
	}

	
	
	
		
});
	