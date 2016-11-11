

/* ----------------------
	watchdog
----------------------- */

new CircularModule('watchdog', {
		
	config				: { 
		timeout		: 50,
		muinterval: 500,
		debug			: false,
	},
	
	settings 			: {
		requiremods	: ['log','registry','engine']
	},

	attributes		: {},
	
	init					: function() { 
		return true;
	},
	
	//-----------------------
	
	
	timer				: null,
	lock				: false,	// watchdog is locked while releasing

	domobserver 		:	null,
	countdobs				: 0,
	
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
	countpobs				: 0,

	eventsin	: {
		nodes		: [
			// Node,Node,..
		],
		records	: [
			// {type:type,flag:flag,target:target},
			// {type:pass,flag:attrdatachanged,target:class},..
			// {type:event,flag:attrdatachanged,target:class},..
			// {type:ignore,flag:ocontextchanged,target:*},..
		]
	},
	
	eventsout	: {
		// copy of eventsin on release()
	},
	
	
	
	init	: function() {
		this.debug('@watchdog.init');
		this.domobserver = new MutationObserver(Circular.watchdog.ondomchange);
		if (!Object.observe) {
			Circular.log.warn('@watchdog.init','emulating object.observe');
			setInterval(function() {
				Platform.performMicrotaskCheckpoint();
			},this.config.muinterval);
		}
	},
	
	die	: function() {
		this.debug('@watchdog.die');
		this.domobserver.disconnect();
		for (path in this.pathobservers) {
			this.pathobservers[path].observer.close();
		}
		this.pathobservers = {};
	},
	
	watch	: function (node,ccnode) {
		this.debug('@watchdog.watch');
		if (!ccnode) ccnode = Circular.registry.get(node);
		if (node instanceof jQuery) node = node.get(0);
		this.watchdom(node,ccnode);
		this.watchdata(node,ccnode);

		
		
		ccnode.flags['watched'] = true;
		// needed if watch is called from outside ..
		Circular.registry.set(node,ccnode);

	},
	
	
	
	watchdom	: function(node,ccnode) {
		if (!ccnode.flags.domobserved) {
			this.debug('@watchdog.watchdom',ccnode);
			this.domobserver.observe(node, { 
				attributes				: true, 
				attributeOldValue	: true,
				childList			: true, 
				characterData	: true,
				subtree				: false
			});

			ccnode.flags.domobserved=true;
			this.countdobs++;
			// no need to do this here
			// Circular.registry.set(node,ccnode);
		}
	},
	
	ondomchange	: function(records,observer) {
		Circular.watchdog.debug('@watchdog.ondomchange',records);
		
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
					if (record.oldValue===null || record.target.getAttribute(record.attributeName)===null) {
						Circular.watchdog.catch(record.target,'event','attrsetchanged');
					} else {
						Circular.watchdog.catch(record.target,'event','attrdomchanged',record.attributeName);
					}
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
					Circular.log.error('@watchdog.ondomchange','unknown record type '+record.type);
			}
		},this);
		
	},
	

	watchdata	: function(node,ccnode) {
		if (ccnode.flags.attrdomchanged || ccnode.flags.attrsetchanged) {
			this.debug('@watchdog.watchdata',node,ccnode);
			
			ccnode.index.forEach(function(ccattr,idx) {
				if (ccattr.flags.attrdomchanged) {
					if (ccattr.content.paths && ccattr.content.paths.length) {
						
						//var ignorepaths = [];
						if (!ccattr.content.oldpaths) ccattr.content.oldpaths = [];
						
						// remove old content.paths
						if (ccattr.content.oldpaths.length) {
							ccattr.content.oldpaths.forEach(function(oldpath) {
								if (this.pathobservers[oldpath]) {
									if (ccattr.content.paths.indexOf(oldpath)==-1) {
										this.debug('@watchdog.watchdata','removing  path',oldpath);
										var object=null,subpath='';
										var split = oldpath.indexOf('.');
										if (split!=-1) subpath = oldpath.substring(split+1)
										if (subpath) {
											for (var pc=0;pc<this.pathobservers[oldpath].properties.length;pc++) {
												var property = this.pathobservers[oldpath].properties[pc];
												if (property && property.node==node && property.type=='attribute' && property.id == ccattr.properties.name) {
													delete this.pathobservers[oldpath].properties[pc];
													if (!this.pathobservers[oldpath].properties.length) {
														this.debug('@watchdog.watchdata','closing pathobserver',oldpath);
														this.pathobservers[oldpath].observer.close();
														delete this.pathobservers[oldpath];
														this.countpobs--;
													}
												}
											}
										} else {
											Circular.log.error('@watchdog.watchdata','cant split path '+path);
										}
									}
								}
							},this);
							ccattr.content.oldpaths = [];
						} 
						
						// add new content.paths
						ccattr.content.paths.forEach(function(path) {
							if (ccattr.content.oldpaths.indexOf(path)==-1) {
								this.debug('@watchdog.watchdata','adding path',path);
								if (path!='this') {
									var object=null,subpath='';
									var split = path.indexOf('.');
									if (split==-1) {
										Circular.log.warn('@watchdog.watchdata','observe cannot be called on the global proxy object',path);
									} else {
										object 	= Circular.parser.eval(path.substring(0,split));
										subpath = path.substring(split+1)
									}
									if (object && subpath) {
										var property = {
											'node'		:	node,
											'type'		: 'attribute',
											'id'			: ccattr.properties.name
										};
										if (!this.pathobservers[path]) {
											if (object !== window) {
												this.pathobservers[path] = {
													'observer'	: new PathObserver(object,subpath),
													'properties': [property]
												};
												this.countpobs++;
												this.pathobservers[path].observer.open(function(newvalue,oldvalue) {
													Circular.watchdog.ondatachange(path,newvalue,oldvalue)
												});
											} else {
												Circular.log.warn('@watchdog.watchdata','observe cannot be called on the global proxy object',path);
											}

										} else {
											this.pathobservers[path].properties.push(property);
										}
									} else {
										Circular.log.error('@watchdog.watchdata','cant split path ',path);
									}
								} // this
							} else {
								this.debug('@watchdog.watchdata','path already watched',path);
							}
						},this);
					
					} else {
						this.debug('@watchdog.watchdata','no content.paths',ccattr.properties.name);
					}

					ccnode.flags.dataobserved=true;
				} else {
					this.debug('@watchdog.watchdata','no attrdomchanged',ccattr.properties.name);
				}
			},this);
		} else {
			this.debug('@watchdog.watchdata','no attrdomchanged in node',node.tagName);
		}
	},
	
	ondatachange	: function(fullpath,newvalue,oldvalue) {
		this.debug('@watchdog.ondatachange',fullpath);
		this.pathobservers[fullpath].properties.forEach(function(prop) {
			switch (prop.type) {
				case 'attribute':
					this.catch(prop.node,'event','attrdatachanged',prop.id);
					break;
				default:
					Circular.log.error('@watchdog.ondatachange','unknown property type '+prop.type);
			}
		},this);
	},
	
	
	
	pass	: function(node,event,target) {
		//this.debug('@watchdog.pass');
		this.catch(node,'pass',event,target);
	},
	ignore	: function(node,event,target) {
		//this.debug('@watchdog.ignore');
		this.catch(node,'ignore',event,target);
	},
	unignore	: function(node,event,target) {
		//this.debug('@watchdog.unignore');
		// todo: add domchange/datachange timeout
		this.catch(node,'unignore',event,target);
	},

	catch	: function(node,type,flag,target) {
		this.debug('@watchdog.catch',node,type,flag,target);
		clearTimeout(this.timer);
		
		var nodeidx = this.eventsin.nodes.indexOf(node);
		if (nodeidx==-1) {
			nodeidx=this.eventsin.nodes.length;
			this.eventsin.nodes.push(node);
		}
		if (!this.eventsin.records[nodeidx]) {
			this.eventsin.records[nodeidx] = [];
		}
		this.eventsin.records[nodeidx].push({type:type,flag:flag,target:target});
		
		
		this.timer = setTimeout(function () {
			Circular.queue.add(function() {
				Circular.watchdog.release();
			});
		}, this.config.timeout);
		
	},
	
	release	: function() {
	
		this.debug('@watchdog.release');

		// copy & clean caught to releaseing
		// read all the records
		// set node properties where needed
		// recycle all nodes involved

		
		if (this.lock) {
			Circular.log.fatal('@watchdog.release','found lock: another watchdog seems to be running');
			return false;
		}
		this.lock = true;
		$.extend(true,this.eventsout,this.eventsin);
		this.eventsin.nodes = [];
		this.eventsin.records = [];
		

		for (var nc=0;nc<this.eventsout.nodes.length;nc++) {
			var node			= this.eventsout.nodes[nc];
			var records 	= this.eventsout.records[nc];
			var ccnode 		= Circular.registry.get(node);
			
			// {type,flag,target}
			for (var rc=0; rc<records.length;rc++) {
				var record = records[rc];
				var processing = false;
				switch (record.type) {
					case 'event' :
						switch (record.flag) {
						
							// ccattr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (ccnode.attributes[record.target]) {
									
										if (ccnode.attributes[record.target].flags[record.flag+':i']) {
											this.debug('@watchdog.release','ccattr ignoring flag',record.flag);
											break;
										}
										if (ccnode.attributes[record.target].properties[record.flag+':p']) {
											this.debug('@watchdog.release','ccattr passing flag',record.flag);
											ccnode.attributes[record.target].properties[record.flag+':p']--;
											break;
										}
										this.debug('@watchdog.release',record.flag,record.target,node);
										ccnode.attributes[record.target].flags[record.flag]=true;
										ccnode.flags[record.flag]=true;
										ccnode.flags.processing=true;
									} else {
										this.debug('@watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('@watchdog.release','ccattr event target missing ',record);
								}
								break;
							
							

							case 'attrsetchanged':
							
								if (ccnode.flags['attrsetchanged:i']) {
									this.debug('@watchdog.release','node ignoring attrsetchanged');
									break;
								}
								if (ccnode.properties['attrsetchanged:p']) {
									this.debug('@watchdog.release','node passing attrsetchanged');
									ccnode.properties['attrsetchanged:p']--;
									break;
								}
								this.debug('@watchdog.release','attrsetchanged',record,node);
								ccnode.flags['attrsetchanged']=true;
								ccnode.flags.processing=true;
								break;
								
							case 'contentchanged':
							
								if (ccnode.flags['contentchanged:i']) {
									this.debug('@watchdog.release','node ignoring contentchanged');
									break;
								}
								if (ccnode.properties['contentchanged:p']) {
									this.debug('@watchdog.release','node passing contentchanged');
									ccnode.properties['contentchanged:p']--;
									break;
								}
								this.debug('@watchdog.release','contentchanged',record,node);
								ccnode.flags['contentchanged']=true;
								ccnode.flags.processing=true;
								break;
								
							default:
								Circular.log.error('@watchdog.release','unknown flag '+record.flag,record);
						}
						
						if (ccnode.flags.processing) {
							// see if there were any watchers on 'this'
							// and notify them of these changes for the next cycle
							ccnode.index.forEach(function(ccattr) {
								if (ccattr.content.paths.indexOf('this')!=-1 && record.target!=ccattr.properties.name) {
									this.debug('triggering catchall for path "this"',node);
									Circular.watchdog.catch(node,'event','attrdatachanged',ccattr.properties.name);
								}
							});
						}
						
						break;
						
					case 'pass' :
						switch (record.flag) {
						
							// ccattr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (ccnode.attributes[record.target]) {
										ccnode.attributes[record.target].properties[record.flag+':p']++;
									} else {
										this.debug('@watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('@watchdog.release','ccattr event target missing ',record);
								}
								break;
							
							// node events
							case 'attrsetchanged':
								ccnode.properties['attrsetchanged:p']++;
								break;
								
							case 'contentchanged':
								ccnode.properties['contentchanged:p']++;
								break;
							

								
							default:
								Circular.log.error('@watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					case 'ignore' :
						switch (record.flag) {
						
							// ccattr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (ccnode.attributes[record.target]) {
										ccnode.attributes[record.target].flags[record.flag+':i']=true;
									} else {
										this.debug('@watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('@watchdog.release','ccattr event target missing ',record);
								}
								break;

							// node events
							case 'attrsetchanged':
								ccnode.flags['attrsetchanged:i']=true;
								break;
								
							case 'contentchanged':
								ccnode.flags['contentchanged:i']=true;
								break;
								

								
							default:
								Circular.log.error('@watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					case 'unignore' :
						switch (record.flag) {
						
							// ccattr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (ccnode.attributes[record.target]) {
										ccnode.attributes[record.target].flags[record.flag+':i']=false;
									} else {
										this.debug('@watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('@watchdog.release','ccattr event target missing ',record);
								}
								break;

							// node events
							case 'attrsetchanged':
								ccnode.flags['attrsetchanged:i']=false;
								break;
								
							case 'contentchanged':
								ccnode.flags['contentchanged:i']=false;
								break;
								
							default:
								Circular.log.error('@watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					default:
						Circular.log.error('@watchdog.release','unknown record type '+record.type,record);
				}
			}
			
			// todo: we're not storing the pass and un/ignore flags ?
			if (ccnode.flags.processing) {
				Circular.registry.set(node,ccnode);
			}
		};
		
		// make hte array unsparse
		var todo = [];

		this.eventsout.nodes.forEach(function(node) { 
			var ccnode = Circular.registry.get(node);
			if (ccnode.flags.processing) {
				todo.push(node); 
				Circular.registry.lock(node);
			}
		});
		if (todo.length) {
			this.debug('recycling '+todo.length+' nodes');
			if (this.config.debug) this.report(this.eventsout);		
			Circular.engine.recycle(todo,true);
			
		}
		this.eventsout = {};
		this.lock = false;
		return true;
	},
	
	report	: function(list) {
		if (!list) list = this.eventsin;
		Circular.log.write('@watchdog.report======================');
		list.nodes.forEach(function(node,idx) {
			Circular.log.write(node.tagName,list.records[idx]);
		},this);
		Circular.log.write('======================================');
	},
	
	debug	: function() {
		if (this.config.debug) {
			Circular.log.debug.apply(Circular.log,arguments);
		}
	}

	
	
	
		
});
	