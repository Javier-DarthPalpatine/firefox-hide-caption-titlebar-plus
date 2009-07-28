
window.addEventListener('load', function() { HideCaption.OnLoad() }, false);
window.addEventListener('resize', function(e) { HideCaption.OnResize(e) }, false);
window.addEventListener('beforeunload', function(e) { HideCaption.OnClose() }, false);
window.addEventListener('unload', function(e) { HideCaption.OnClose() }, false);
window.onbeforeunload = function() { HideCaption.OnClose(); }

var DownX, DownY, DownT, DblClk;
var FormX, FormY, FormW, FormH;
var WinState, Resizing, InitPos, gPref;

var DragCtrlsTagName = ["toolbarspring", "toolbarspacer"];
var DragCtrls = [
	"navigator-throbber", //dp: this doesnt work , don't know why
    "window-controls", "statusbar-display", "hc-drag-space", "tabsontop-place-bar", "stop-button"];

var HideCaption = {

	//new behavior (will be configurable)
	setCaptionOnRestore_option: true,
	//haveCaption_OnlyForRestore: false, // this caption was set only due to the corresponding xxx_option ! (isn't a popup that should have caption_permanent and such)

	haveCaption_Permanent     : false,
	haveCaption               : false,
	
	mainW          : null,
	processOnResize: true,

	settedMaxSize : false,
	
    Close : function() {
        if (this.GetBoolPref("min-on-close",null))
            window.minimize();
        else
            BrowserTryToCloseWindow();
    },
    
    SetMaxSize : function() {

		this.myDumpToConsole("SetMaxSize: settedMaxSize= "+this.settedMaxSize+" ,  WinState= "+WinState ); //this.haveCaptionOnlyForRestore
        
		if( this.settedMaxSize && WinState > 0 ){ // win32 is generating a 2nd resize-maximize() event (perhaps when hidechrome is set to true.)
			this.myDumpToConsole("SetMaxSize: SKIPPING !!!!!!!!!! ---------------------------------------------------------------- ");
			return;
		}

		WinState |= 1; 
		
		HideCaption.processOnResize= false;
		this.doSetMaxSize();
		HideCaption.processOnResize= true;
		
		this.SaveInDB_Pos_Size(); // save this for "Open New Window" CTRL+N command (new windows will be the same as 1st)
    },
	doSetMaxSize: function(){
		
        var x = 0;  var w = screen.availWidth;
        var y = 0;  var h = screen.availHeight;

        if (h==screen.height && w==screen.width) {
            var tb=this.GetCharPref("taskbar_pos",
                "").toLowerCase();
            if (tb=="left" || tb=="right") {
                w -= 1; x = tb=="left" ? 1 : 0;
            }
            else {
                h -= 1; y = tb=="top" ? 1 : 0;
            }
        }
        else {
            x=screen.availLeft; y=screen.availTop;
        }
		
        var isMaximizedWin= window.windowState==window.STATE_MAXIMIZED;
		
		if( ! this.haveCaption_Permanent  ){ // this.haveCaptionOnlyForRestore -- only it it ISNT a permanent caption

			this.mainW.setAttribute("hidechrome", "true");
			this.haveCaption= this.mainW.getAttribute("hidechrome") != "true";
			//this.haveCaptionOnlyForRestore= false;

			this.myDumpToConsole("SetMaxSize: (with timeout) ");
			
					HideCaption.my_moveTo(x,y);
					if( !isMaximizedWin ){
						HideCaption.my_maximize();
					}
			
			setTimeout(	function()
				{
					HideCaption.processOnResize= false;
					Resizing += 1;
					
					HideCaption.my_resizeTo(w,h);
					
					Resizing -= 1;
					HideCaption.processOnResize= true;
				}, 20); // setTimeout()
			
		}else{
			this.myDumpToConsole("SetMaxSize: ");
			this.my_moveTo(x,y); 
			this.my_resizeTo(w,h);
		}

        this.settedMaxSize= true; 
	},
    
    Maximize : function() {
		if( this.haveCaption_Permanent ){
			if( window.windowState != window.STATE_MAXIMIZED ){
				WinState |= 1;
				window.maximize();
			}else{
				WinState = 0;
				window.restore();
			}
			//return; // !!
			
		}else{ // ! this.haveCaption_Permanent 
			
			Resizing += 1;
			if (WinState == 0) {
				this.SavePosSize(); this.SetMaxSize();
			}
			else if(WinState >= 2){
				BrowserFullScreen();
				this.myDumpToConsole("    called BrowserFullScreen() !");
			}else {
				this.RestoreWin();
				WinState = 0;

			}
			Resizing -= 1; 
			this.ResetBorder();
		}
		this.SaveInDB_Pos_Size(); // save this for "Open New Window" CTRL+N command (new windows will be the same as 1st)
    },

    RestoreWin : function() {
		HideCaption.processOnResize= false;
		this.doRestoreWin();
		HideCaption.processOnResize= true;
	},
    doRestoreWin : function() {

		this.haveCaption= this.mainW.getAttribute("hidechrome") != "true";
		if( this.setCaptionOnRestore_option ){
			if( !this.haveCaption ){
				//this.haveCaptionOnlyForRestore= true;
				this.mainW.setAttribute("hidechrome", "false");
				this.haveCaption= this.mainW.getAttribute("hidechrome") != "true";
			}
			
			this.myDumpToConsole("RestoreWin: (with timeout) ");
			
							HideCaption.my_maximize();  // only WIn32??
							HideCaption.my_moveTo(FormX, FormY);
							HideCaption.my_restore();
							HideCaption.my_resizeTo(FormW-1, FormH);
			
			setTimeout(	function(){
							HideCaption.processOnResize= false;
							Resizing += 1;
							
							HideCaption.my_resizeTo(FormW, FormH);
							
							Resizing -= 1;
							HideCaption.processOnResize= true;
						}, 20); 
		}else{
			this.myDumpToConsole("RestoreWin: ");
			this.my_moveTo(FormX, FormY);
			this.my_resizeTo(FormW, FormH);
		}
		
		this.settedMaxSize= false; 
	},
	
	my_moveTo: function(_x, _y){
		this.debug_move("moveTo("+_x+","+_y+")");
		window.moveTo  (_x, _y);	
	},
	my_resizeTo: function(_x, _y){
		this.debug_move("resizeTo("+_x+","+_y+")");
		window.resizeTo(_x, _y);
	},
	my_maximize: function(){
		this.debug_move("maximize()");
		window.maximize();
	},
	my_restore: function(){
		this.debug_move("restore()");
		window.restore();
	},
	
	debug_move: function(_sMsg){
		this.myDumpToConsole("        >> about to: "+_sMsg);
	},
	
    OnLoad : function() {
        var ctrlW, Class;

        this.mainW = document.getElementById("main-window");

        Class = "@mozilla.org/preferences-service;1";
        gPref = Components.classes[Class].getService(
            Components.interfaces.nsIPrefService).
            getBranch("extensions.");

        InitPos = 1; Resizing = 0; WinState = 0; 
        DownT = 0; DblClk = 0; this.SavePosSize(); 

		this.LoadFromDB_Pos_Size(); //read WinState !!!
		
		var use_caption_option= this.GetCharPref("use_caption", "smart").toLowerCase(); // never, smart, always
		// check in LINUX!!!
		this.myDumpToConsole("   final use_caption: "+use_caption_option);
		if( 		use_caption_option == "never"){
			this.setCaptionOnRestore_option= false;
		}else if( 	use_caption_option == "always"){
			// NOT implemented yet!
		}else{ // default:  smart  !!!
			this.setCaptionOnRestore_option= true;
		}
		this.myDumpToConsole("  setted  setCaptionOnRestore_option: "+this.setCaptionOnRestore_option);

		var hidechrome= false;
        if (this.mainW) {
		
			var menubar = document.getElementById("toolbar-menubar");
			if( getComputedStyle(menubar,"").display != "-moz-box" ){  //leave POPUPS with Caption, close box, etc
				//hidechrome= false;
				this.haveCaption_Permanent = true; //?? have popup have captionOnRestore also?
			}else{
				if( this.setCaptionOnRestore_option  && WinState == 0 ){
					//leave restored win
				}else{
					hidechrome= true;
				}
			}
			this.mainW.setAttribute("hidechrome", hidechrome?"true":"false"); // ALWAYS set this attribute for css to work well!
			this.haveCaption= this.mainW.getAttribute("hidechrome") != "true";
					
            FormX = this.mainW.getAttribute("screenX");
            FormY = this.mainW.getAttribute("screenY");
        }

		const _XULNS= "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        for(var i=0; i<DragCtrlsTagName.length; i++) {
            var tagArray = document.getElementsByTagNameNS(_XULNS, DragCtrlsTagName[i]);
            //tagArray   = document.getElementsByTagName( DragCtrlsTagName[i]);
			if(tagArray){
				for(var itag=0; itag<tagArray.length; itag++) {
					ctrlW= tagArray[itag];
					if (ctrlW){
						ctrlW.onmousedown= HideCaption.MouseDown;
						//ctrlW.setAttribute('tooltiptext', "Drag Window!!!!");
					}
				}
			}
		}

        for(var i=0; i<DragCtrls.length; i++) {
            ctrlW = document.getElementById(DragCtrls[i]);
            if (ctrlW){
                ctrlW.onmousedown= HideCaption.MouseDown;
				//ctrlW.setAttribute('tooltiptext', "Drag Window!!!!");
			}
        }
		

    },
  
    OnClose : function() {
		this.SaveInDB_Pos_Size();
    },
	
    SaveInDB_Pos_Size : function() {
		var pos_size= WinState+","+FormX+","+FormY+","+FormW+","+FormH
        gPref.setCharPref("hide_caption.pos_size", pos_size);
		this.myDumpToConsole("                  saved    pos_size="+pos_size);
    },
	
    LoadFromDB_Pos_Size : function() {
		var split = this.GetCharPref("pos_size","").split(",");
		this.myDumpToConsole("                  obtained pos_size="+split);
			
		if (split.length == 5) {
				WinState = split[0] & 3;
                if( split[3]<320 ) split[3]= 320;
				if( split[4]<240 ) split[4]= 240;
                FormX = split[1]; FormY = split[2];
                FormW = split[3]; FormH = split[4];
				
				return true;
		}
		return false;
	},

	myDumpToConsole : function(aMessage){
		//var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//consoleService.logStringMessage("" + aMessage);
		
		//Components.utils.reportError(e); // report the error and continue execution
	},
	
    OnResize : function(e) {
	
        var inFull, menubar, winctrls, State0;
        
        inFull = document.getElementById("nav-bar").
            getAttribute("inFullscreen");
        menubar = document.getElementById("toolbar-menubar");
        winctrls = document.getElementById("window-controls");

        if( inFull=="true" ){
			if( this.haveCaption ){ // fix when doing F11 from restored win
				this.mainW.setAttribute("hidechrome", "true");
				this.haveCaption= false;
			}
		}else{ // inFull == false
			if( WinState == 0 ){
				this.mainW.setAttribute("hidechrome", "false");
				this.haveCaption= true;
			}
		}
		
		var hidden_Menu_Bar= 	menubar.getAttribute("collapsed")=="true" || 
								getComputedStyle(menubar,"").display=="none";
		
        if( this.GetBoolPref("show_nav_close_btn",true) ){
			winctrls.setAttribute("hidden", "false");
			
        }else if( ( inFull=="true" || !this.haveCaption )  && hidden_Menu_Bar ){
			winctrls.setAttribute("hidden", "false");
			
		}else{
            winctrls.setAttribute("hidden", "true");
		}

        if (window.windowState!=window.STATE_MAXIMIZED &&
            WinState==0 && Resizing==0 && inFull!="true")
            this.SavePosSize();

		State0 = WinState;
        inFull=="true" ? WinState |= 2 : WinState &= 1;

		//DEBUG !!!!
		this.myDumpToConsole(">> OnResize: hidec="+this.mainW.getAttribute("hidechrome")+
			"   process:"+HideCaption.processOnResize+(HideCaption.processOnResize?"":"            || ")+
			" WinState:"+WinState+
			" STATE_MAXIMIZED:"+(window.windowState==window.STATE_MAXIMIZED)+
			" - e: "+
			e.target.screenX+" "+e.target.screenY+" "+
			" - mainW: "+
			this.mainW.width+" "+this.mainW.height+" "+
			"");
		
        //DarthPalpatine@dummy.addons.mozilla.org: don't maximize popup/captioned windows ! (the most frequent ones, without menubar)
        if( getComputedStyle(menubar,"").display != "-moz-box" ||
			this.haveCaption_Permanent ){ 

			//winctrls.setAttribute("hidden", "true");
			inFull=="true" ? WinState |= 2 : (window.windowState==window.STATE_MAXIMIZED? WinState |= 1 : WinState = 0); // for mousemove in status bar
			this.ResetBorder(); // after setting WinState
			return; // RETURN here!!!!
        }
		
		if( ! HideCaption.processOnResize ){  //SKIPPING !!! - don't mess anything more!
			return;
		}
			
        if (window.windowState==window.STATE_MAXIMIZED) {
            this.SetMaxSize(); this.ResetBorder();
        }
        else{
            this.ResetBorder();
		}

        if (InitPos == 1) {
            InitPos =  0;

			if( this.LoadFromDB_Pos_Size() ){
				var WinState_bak= WinState;
                Resizing += 1; 
                if (WinState & 3){
                    (WinState&2) ? BrowserFullScreen()
                        : window.maximize();
                }else {
					if( ! this.haveCaption ){
						this.RestoreWin();
					}
                }
                Resizing -= 1; 
				WinState = WinState_bak;
            }
        }
        else if(State0==2 && Resizing==0 && WinState==
            0) {
            Resizing += 1; 
			this.RestoreWin();
			Resizing -= 1;
        }
    },
    
    MouseDown : function(e) {
        if (e.button==0) {
            if (DownT!=0 && DblClk!=1 && e.timeStamp-DownT<=
                400 && DownX==e.screenX && DownY==e.screenY)
                DblClk = 1;
            else {
                DownT = e.timeStamp; DblClk = 0;
            }
        }
        if (e.button==0 && document.getElementById(e.target.id
            ).parentNode.id!="window-controls") {
            if (WinState == 0) {
                FormX = screenX; FormY = screenY;
            }
            DownX = e.screenX; DownY = e.screenY;
            document.addEventListener("mouseup",   HideCaption
                .MouseUp, true);
            document.addEventListener("mousemove", HideCaption
                .MouseMove, true);
        }
    },

    MouseUp : function(e) {
        document.removeEventListener("mouseup",   HideCaption.
            MouseUp, true);
        document.removeEventListener("mousemove", HideCaption.
            MouseMove, true);
        if (WinState==0) HideCaption.SavePosSize();

        if (e.button==0 && DblClk==1 && e.timeStamp-DownT<=800
            ) {
            DownT = 0; DblClk = 0; HideCaption.Maximize();
        }
    },
    
    MouseMove : function(e) {
        if (e.screenX!=DownX || e.screenY!=DownY) {
            DownT = 0; DblClk = 0;
        }
        if (WinState == 0) 
            window.moveTo(FormX+e.screenX-DownX, FormY+e.
                screenY-DownY);
    },
    
    SavePosSize : function() {
        var width, height;
        
        width = this.mainW.getAttribute("width");
        height= this.mainW.getAttribute("height");

		if( width <320 ) width= 320;
		if( height<240 ) height=240;
		if( width >screen.width ) width = screen.width;
		if( height>screen.height) height= screen.height;

		FormX = screenX; FormW = width;
        FormY = screenY; FormH = height;
			
		this.myDumpToConsole("   SavePosSize:  saved coords!!: "+FormX+","+FormY+","+FormW+","+FormH);
	},

    ResetBorder : function() {
        var MaxFull = WinState!=0 ? true : false;
        if (MaxFull != this.mainW.getAttribute("hc-MaxFull")) {
            if (MaxFull)
                this.mainW.setAttribute(       "hc-MaxFull", MaxFull);
			else
                this.mainW.removeAttribute(    "hc-MaxFull");
        }
		//this.haveCaption= this.mainW.getAttribute("hidechrome") != "true";
		// check new haveCaption var also.
		//var n=0;
        //for(var n=1; n<=8; n++) {
        //       document.getElementById("hc-resizer"+n).style
        //            .display = MaxFull || this.haveCaption ? "none" : "-moz-box";  // setted in CSS
        //}
    },
    
    GetBoolPref : function(Name, DefVal) {
        var hcName = "hide_caption." + Name;
        try {
            return gPref.getBoolPref(hcName);
        }
        catch(e) {
            if (DefVal)
                gPref.setBoolPref(hcName, DefVal);
            return DefVal;
        }
    },
    
    GetCharPref : function(Name, DefVal) {
        var hcName = "hide_caption." + Name;
        try {
            return gPref.getCharPref(hcName);
        }
        catch(e) {
            if (DefVal)
                gPref.setCharPref(hcName, DefVal);
            return DefVal;
        }
    },
    
};
