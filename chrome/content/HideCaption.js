window.addEventListener('load', function() { HideCaption.OnLoad() }, false);
window.addEventListener('resize', function(e) { HideCaption.OnResize(e) }, false);
window.onbeforeunload = function() { HideCaption.OnClose(); }

var DownX, DownY, DownT, DblClk;
var FormX, FormY, FormW, FormH;
var WinState, Resizing, InitPos, gPref, haveCaption= false;
var DragCtrls = ["toolbarspring", "navigator-throbber",
    "window-controls", "statusbar-display", "hc-drag-space"];

var HideCaption = {

    Close : function() {
        if (this.GetBoolPref("min-on-close",null))
            window.minimize();
        else
            BrowserTryToCloseWindow();
    },
    
    SetMaxSize : function() {
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
        WinState |= 1; moveTo(x,y); resizeTo(w,h);
    },
    
    Maximize : function() {
		if( haveCaption ){
			if( window.windowState != window.STATE_MAXIMIZED ){
				WinState |= 1;
				window.maximize();
			}else{
				WinState = 0;
				window.restore();
			}
			return; // !!
		}
			
        Resizing += 1;
        if (WinState == 0) {
			this.SavePosSize(); this.SetMaxSize();
        }
        else if(WinState >= 2)
            BrowserFullScreen();
        else {
			this.RestoreWin();
            WinState = 0;
        }
        Resizing -= 1; this.ResetBorder();
    },
  
    RestoreWin : function() {
        
		window.moveTo(FormX, FormY);
		window.resizeTo(FormW, FormH);
	},
  
    OnLoad : function() {
        var mainW, ctrlW, Class;

        Class = "@mozilla.org/preferences-service;1";
        gPref = Components.classes[Class].getService(
            Components.interfaces.nsIPrefService).
            getBranch("extensions.");

        InitPos = 1; Resizing = 0; WinState = 0; 
        DownT = 0; DblClk = 0; this.SavePosSize(); 

        mainW = document.getElementById("main-window");
        if (mainW) {

			var menubar = document.getElementById("toolbar-menubar");
			if( getComputedStyle(menubar,"").display != "-moz-box" ){  //leave POPUPS with Caption, close box, etc
				mainW.setAttribute("hidechrome", "false");
			}else{
				mainW.setAttribute("hidechrome", "true");
			}
			haveCaption= mainW.getAttribute("hidechrome") != "true";
					
            FormX = mainW.getAttribute("screenX");
            FormY = mainW.getAttribute("screenY");
        }

        for(i=0; i<DragCtrls.length; i++) {
            if (i == 0)
                ctrlW = document.getElementsByTagName(
                    DragCtrls[i])[0];
            else
                ctrlW = document.getElementById(DragCtrls
                    [i]);
            if (ctrlW){
                ctrlW.onmousedown= HideCaption.MouseDown;
				//ctrlW.setAttribute('tooltiptext', "Drag Window");
			}
        }

    },
  
    OnClose : function() {
        gPref.setCharPref("hide_caption.pos_size", WinState
            +","+FormX+","+FormY+","+FormW+","+FormH);
    },

    OnResize : function(e) {
        var main_w, inFull, menubar, winctrls, State0;
        
        inFull = document.getElementById("nav-bar").
            getAttribute("inFullscreen");
        main_w = document.getElementById("main-window");
        menubar = document.getElementById("toolbar-menubar");
        winctrls = document.getElementById("window-controls");

        //DarthPalpatine@dummy.addons.mozilla.org: don't maximize popup/captioned windows ! (the most frequent ones, without menubar)
        if( getComputedStyle(menubar,"").display != "-moz-box" ||
			haveCaption ){

			winctrls.setAttribute("hidden", "true");
			this.ResetBorder();
			window.windowState==window.STATE_MAXIMIZED? WinState |= 1 : WinState = 0; // for mousemove in status bar
			return; // RETURN here!!!!
        }
		
        if (inFull=="true"|| menubar.getAttribute("collapsed"
            )=="true" || getComputedStyle(menubar,"").display
            =="none" || this.GetBoolPref("show_nav_close_btn"
            ,true))
            winctrls.setAttribute("hidden", "false");
        else
            winctrls.setAttribute("hidden", "true");

        if (window.windowState!=window.STATE_MAXIMIZED &&
            WinState==0 && Resizing==0 && inFull!="true")
            this.SavePosSize();

        State0 = WinState;
        inFull=="true" ? WinState |= 2 : WinState &= 1;
        if (window.windowState==window.STATE_MAXIMIZED) {
            this.SetMaxSize(); this.ResetBorder();
        }
        else
            this.ResetBorder();

        if (InitPos == 1) {
            InitPos = 0;

            var split = this.GetCharPref("pos_size","")
                .split(",");
            if (split.length == 5) {
                Resizing += 1; WinState = split[0] & 3;
                if (split[3]>=360 && split[4]>=240) {
                    FormX = split[1]; FormY = split[2];
                    FormW = split[3]; FormH = split[4];
                }
                if (WinState & 3)
                    (WinState&2) ? BrowserFullScreen()
                        : window.maximize();
                else {
					this.RestoreWin();
                }
                Resizing -= 1; WinState = split[0] & 3;
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
        var mainW, width, height;
        
        mainW = document.getElementById("main-window");
        width = mainW.getAttribute("width");
        height = mainW.getAttribute("height");
        if (width>=360 && height>=240 && (width<screen
            .width || height<screen.height)) {
            FormX = screenX; FormW = width;
            FormY = screenY; FormH = height;
        }
    },

    ResetBorder : function() {
        var mainW = document.getElementById("main-window");
        var MaxFull = WinState!=0 ? true : false;
        if (MaxFull != mainW.getAttribute("hc-MaxFull")) {
            if (MaxFull)
                mainW.setAttribute("hc-MaxFull", MaxFull);
            else
                mainW.removeAttribute("hc-MaxFull");
        }
		// check new haveCaption var also.
        for(n=1; n<=8; n++) {
                document.getElementById("hc-resizer"+n).style
                    .display = MaxFull || haveCaption ? "none" : "-moz-box";
        }
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
