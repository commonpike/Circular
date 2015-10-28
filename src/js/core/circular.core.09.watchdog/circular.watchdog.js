

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
	
	caught	: {
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
	
	releasing	: {
		// copy of caught on release()
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
		
		// unset the flags youve set before recycle
		props.flags['contentchanged'] = false;
		props.flags['contextchanged'] = false;
		props.flags['attrdomchanged'] = false;
		props.flags['attrdatachanged'] = false;
		for (var ac=0; ac<props.attributes.length; ac++) {
			props.attributes[ac].flags['attrdomchanged'] = false;
			props.attributes[ac].flags['attrdatachanged'] = false;
		}
		Circular.registry.set(node,props);
	},
	
	
	
	watchdom	: function(node,props) {
		if (!props.flags.domobserved) {
			Circular.debug.write('Circular.watchdog.watchdom',props);
			this.domobserver.observe(node, { 
				attributes		: true, 
				childList			: true, 
				characterData	: true,
				subtree				: false
			});
			props.flags.domobserved=true;
			Circular.registry.set(node,props);
		}
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
					Circular.watchdog.catch(record.target,'event','attrdomchanged',record.attributeName);
					break;
				case 'characterData':
					Circular.watchdog.catch(record.target,'event','contentchanged');
					break;
				case 'childList':
					// we have record.addedNodes .. ignoring
					// we have record.removedNodes .. ignoring ?
					Circular.watchdog.catch(record.target,'event','contentchanged');
					break;
				default:
					Circular.log.error('Circular.watchdog.ondomchange','unknown record type '+record.type);
			}
		},this);
		
	},
	
	watchdata	: function(node,props) {
		if (props.flags.attrdomchanged) {
			Circular.debug.write('Circular.watchdog.watchdata',node,props);
			
			props.attributes.forEach(function(attr,idx) {
				if (attr.flags.attrdomchanged) {
					if (attr.paths) {
						var ignorepaths = [];
						if (!attr.oldpaths) attr.oldpaths = [];
						
						// remove old paths
						if (attr.oldpaths.length) {
							attr.oldpaths.forEach(function(oldpath) {
								if (this.pathobservers[oldpath]) {
									if (attr.paths.indexOf(oldpath)==-1) {
										Circular.debug.write('Circular.watchdog.watchdata','removing  path',oldpath);
										var object=null,subpath='';
										var split = oldpath.indexOf('.');
										if (split!=-1) subpath = oldpath.substring(split+1)
										if (subpath) {
											for (var pc=0;pc<this.pathobservers[oldpath].properties.length;pc++) {
												var property = this.pathobservers[oldpath].properties[pc];
												if (property && property.node==node && property.type=='attribute' && property.id == attr.name) {
													delete this.pathobservers[oldpath].properties[pc];
													if (!this.pathobservers[oldpath].properties.length) {
														Circular.debug.write('Circular.watchdog.watchdata','closing pathobserver',oldpath);
														this.pathobservers[oldpath].observer.close();
														delete this.pathobservers[oldpath];
													}
												}
											}
										} else {
											Circular.log.error('Circular.watchdog.watchdata','cant split path '+path);
										}
									}
								}
							},this);
							attr.oldpaths = [];
						} 
						
						// add new paths
						attr.paths.forEach(function(path) {
							if (attr.oldpaths.indexOf(path)==-1) {
								Circular.debug.write('Circular.watchdog.watchdata','adding path',path);
								var object=null,subpath='';
								var split = path.indexOf('.');
								if (split==-1) {
									Circular.log.warn('Circular.watchdog.watchdata','observe cannot be called on the global proxy object',path);
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
											Circular.log.warn('Circular.watchdog.watchdata','observe cannot be called on the global proxy object',path);
										}
									} else {
										this.pathobservers[path].properties.push(property);
									}
								} else {
									Circular.log.error('Circular.watchdog.watchdata','cant split path ',path);
								}
							} else {
								Circular.debug.write('Circular.watchdog.watchdata','path already watched',path);
							}
						},this);
					}
				}
			},this);
		}
	},
	
	ondatachange	: function(fullpath,newvalue,oldvalue) {
		Circular.debug.write('Circular.watchdog.ondatachange',fullpath);
		this.pathobservers[fullpath].properties.forEach(function(prop) {
			switch (prop.type) {
				case 'attribute':
					this.catch(prop.node,'event','attrdatachanged',prop.id);
					break;
				default:
					Circular.log.error('Circular.watchdog.ondatachange','unknown property type '+prop.type);
			}
		},this);
	},
	
	
	
	pass	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.pass');
		this.catch(node,'pass',event,target);
	},
	ignore	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.ignore');
		this.catch(node,'ignore',event,target);
	},
	unignore	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.unignore');
		// todo: add domchange/datachange timeout
		this.catch(node,'unignore',event,target);
	},

	catch	: function(node,type,flag,target) {
		Circular.debug.write('Circular.watchdog.catch',node,type,flag,target);
		clearTimeout(this.timer);
		
		var nodeidx = this.caught.nodes.indexOf(node);
		if (nodeidx==-1) {
			nodeidx=this.caught.nodes.length;
			this.caught.nodes.push(node);
		}
		if (!this.caught.records[nodeidx]) {
			this.caught.records[nodeidx] = [];
		}
		this.caught.records[nodeidx].push({type:type,flag:flag,target:target});
		
		
		this.timer = setTimeout(function () {
			Circular.queue(function() {
				Circular.watchdog.release();
			});
		}, Circular.config.watchdogtimeout);
		
	},
	
	release	: function() {
	
		Circular.debug.write('Circular.watchdog.release');

		// copy & clean caught to releaseing
		// read all the records
		// set node properties where needed
		// recycle all nodes involved

		
		if (this.lock) {
			Circular.log.fatal('Circular.watchdog.release','found lock: another watchdog seems to be running');
			return false;
		}
		this.lock = true;
		$.extend(true,this.releasing,this.caught);
		this.caught.nodes = [];
		this.caught.records = [];
		
		for (var nc=0;nc<this.releasing.nodes.length;nc++) {
			var node			= this.releasing.nodes[nc];
			var records 	= this.releasing.records[nc];
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
											Circular.debug.write('Circular.watchdog.release','attr ignoring flag',record.flag);
											break;
										}
										if (props.name2attr[record.target].flags[record.flag+':p']) {
											Circular.debug.write('Circular.watchdog.release','attr passing flag',record.flag);
											props.name2attr[record.target].flags[record.flag+':p']--;
											break;
										}
										Circular.debug.write('Circular.watchdog.release',record.flag,record.target,node);
										props.name2attr[record.target].flags[record.flag]=true;
										props.flags[record.flag]=true;
										processing=true;
									} else {
										Circular.debug.write('Circular.watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.release','attr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
							
								if (props.flags['contentchanged:i']) {
									Circular.debug.write('Circular.watchdog.release','node ignoring contentchanged');
									break;
								}
								if (props.flags['contentchanged:p']) {
									Circular.debug.write('Circular.watchdog.release','node passing contentchanged');
									props.flags['contentchanged:p']--;
									break;
								}
								Circular.debug.write('Circular.watchdog.release','contentchanged',record,node);
								props.flags['contentchanged']=true;
								processing=true;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.release','unknown flag '+record.flag,record);
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
										Circular.debug.write('Circular.watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.release','attr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
								props.flags['contentchanged:p']++;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.release','unknown flag '+record.flag,record);
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
										Circular.debug.write('Circular.watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.release','attr event target missing ',record);
								}
								break;

							case 'contentchanged':
								props.flags['contentchanged:i']=true;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.release','unknown flag '+record.flag,record);
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
										Circular.debug.write('Circular.watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.release','attr event target missing ',record);
								}
								break;

							case 'contentchanged':
								props.flags['contentchanged:i']=false;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					default:
						Circular.log.error('Circular.watchdog.release','unknown record type '+record.type,record);
				}
			}
			
			// todo: we're not storing the pass and un/ignore flags ?
			if (!processing) {
				delete this.releasing.nodes[nc];
				delete this.releasing.records[nc];
			} else {
				Circular.registry.set(node,props);
				Circular.registry.lock(node);
			}
		};
		
		// make hte array unsparse
		var todo = [];
		this.releasing.nodes.forEach(function(node) { todo.push(node); });
		if (todo.length) {
			Circular.debug.write('recycling '+todo.length+' nodes');
			if (Circular.debug.enabled) this.report(this.releasing);
			Circular.engine.recycle(todo,true);
		}
		this.releasing = {};
		this.lock = false;
		return true;
	},
	
	report	: function(list) {
		if (!list) list = this.caught;
		Circular.log.write('Circular.watchdog.report');
		list.nodes.forEach(function(node,idx) {
			Circular.log.write(node.tagName,list.records[idx]);
		},this);
	}

	
	
	
		
});
	