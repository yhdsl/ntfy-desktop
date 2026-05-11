/**
    Class > Electron Interface Menus

    this class controls the electron menus:
        - main menu
        - tray right-click menu
*/

import { app, Menu, BrowserWindow } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
    define paths / dirnames
*/

const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );

/**
    injected from main index.js
*/

let deps = {};

/**
    dependencies > setter
*/

function setMenuDeps( dependencies )
{
    deps = dependencies;
}

/**
    electron > main menu
*/

function newMenuMain()
{
    const menuMain = [
        {
            label: '应用',
            id: 'app',
            submenu: [
                {
                    label: '设置',
                    id: 'settings',
                    accelerator: 'S',
                    submenu: [
                        {
                            label: '常规设置',
                            id: 'general',
                            accelerator: ( deps.bHotkeysEnabled === 1 || deps.store.getInt( 'bHotkeys' ) === 1 ) ? 'CTRL+G' : '',
                            click: function ()
                            {
                                deps.prompt(
                                    {
                                        title: '常规设置',
                                        label: `常规设置<div class="label-desc">更改应用程序的整体功能。</div>`,
                                        useHtmlLabel: true,
                                        alwaysOnTop: true,
                                        type: 'multiInput',
                                        resizable: false,
                                        customStylesheet: path.join( app.getAppPath(), `pages`, `css`, `prompt.css` ),
                                        height: 640,
                                        icon: deps.appIcon,
                                        multiInputOptions:
                                        [
                                            {
                                                label: '启用开发者工具',
                                                description: '在顶部菜单栏中添加开发者工具',
                                                selectOptions: { 0: '禁用', 1: '启用' },
                                                value: deps.store.get( 'bDevTools' )
                                            },
                                            {
                                                label: '启用快捷键',
                                                description: '允许使用快捷键进行导航',
                                                selectOptions: { 0: '禁用', 1: '启用' },
                                                value: deps.store.get( 'bHotkeys' )
                                            },
                                            {
                                                label: '退出时关闭',
                                                description: '点击关闭按钮时直接退出应用，而不是最小化到托盘',
                                                selectOptions: { 0: '禁用', 1: '启用' },
                                                value: deps.store.get( 'bQuitOnClose' )
                                            },
                                            {
                                                label: '最小化到托盘',
                                                description: '启动时最小化至系统托盘',
                                                selectOptions: { 0: '禁用', 1: '启用' },
                                                value: deps.store.get( 'bStartHidden' )
                                            }
                                        ]
                                    },
                                    deps.guiMain
                                )
                                .then( ( resp ) =>
                                {
                                    if ( resp !== null )
                                    {
                                        // do not update dev tools if value hasn't changed
                                        if ( deps.store.get( 'bDevTools' ) !== resp[ 0 ] )
                                        {
                                            deps.store.set( 'bDevTools', resp[ 0 ] );
                                            deps.activeDevTools();
                                        }

                                        deps.store.set( 'bHotkeys', resp[ 1 ] );
                                        deps.store.set( 'bQuitOnClose', resp[ 2 ] );
                                        deps.store.set( 'bStartHidden', resp[ 3 ] );
                                    }
                                })
                                .catch( ( resp ) =>
                                {
                                    console.error;
                                });
                            }
                        },
                        {
                            label: '实例设置',
                            accelerator: ( deps.bHotkeysEnabled === 1 || deps.store.getInt( 'bHotkeys' ) === 1 ) ? 'CTRL+I' : '',
                            click: function ()
                            {
                                deps.prompt(
                                    {
                                        title: '实例设置',
                                        label: `实例设置<div class="label-desc">官方的 ntfy.sh 服务器，或自行托管的域名/IP。</div>`,
                                        useHtmlLabel: true,
                                        alwaysOnTop: true,
                                        type: 'multiInput',
                                        height: 440,
                                        icon: deps.appIcon,
                                        multiInputOptions:
                                        [
                                            {
                                                label: '实例 URL',
                                                description: '移除所有内容以恢复为官方的 ntfy.sh 服务器。',
                                                value: deps.store.get( 'instanceURL' ) || deps.defInstanceUrl,
                                                inputAttrs: {
                                                    placeholder: '请输入 ntfy 服务器的 URL',
                                                    type: 'url'
                                                }
                                            },
                                            {
                                                label: '本地模式',
                                                description: '如果你正在 localhost 上运行 ntfy 服务器，请启用此选项。',
                                                selectOptions: { 0: '禁用', 1: '启用' },
                                                value: deps.store.get( 'bLocalhost' )
                                            }
                                        ]
                                    },
                                    deps.guiMain
                                )
                                .then( ( resp ) =>
                                {
                                    const argUrl = resp[ 0 ];
                                    let argLHM = resp[ 1 ];

                                    if ( argUrl !== null )
                                    {
                                        const newUrl = ( argUrl === '' ? deps.defInstanceUrl : argUrl );

                                        if ( !argLHM )
                                            argLHM = 0;

                                        deps.store.set( 'instanceURL', newUrl );
                                        deps.store.set( 'bLocalhost', argLHM );

                                        if ( deps.store.getInt( 'bLocalhost' ) === 1 )
                                        {
                                            deps.store.set( 'newUrl', newUrl );

                                            try
                                            {
                                                deps.guiMain.loadURL( newUrl );
                                            }
                                            catch ( error )
                                            {
                                                console.error( 'Error calling loadURL:', error );
                                            }
                                        }
                                        else
                                        {
                                            deps.IsValidUrl( deps.store.get( 'instanceURL' ), 3, 1000 ).then( ( item ) =>
                                            {
                                                deps.statusBadURL = false;
                                                console.log( `Successfully resolved ` + deps.store.get( 'instanceURL' ) );
                                                console.log( 'Loading URL after validation:', deps.store.get( 'instanceURL' ) );
                                                deps.guiMain.loadURL( deps.store.get( 'instanceURL' ) );
                                            }).catch( ( err ) =>
                                            {
                                                deps.statusBadURL = true;
                                                const msg = `Failed to resolve ` + deps.store.get( 'instanceURL' ) + ` - defaulting to ${ deps.defInstanceUrl }`;
                                                deps.statusStrMsg = `${ msg }`;
                                                console.error( `URL validation failed: ${ err.message }` );
                                                console.error( `${ msg }` );
                                                deps.store.set( 'instanceURL', deps.defInstanceUrl );
                                                deps.guiMain.loadURL( deps.defInstanceUrl );
                                            });
                                        }
                                    }
                                })
                                .catch( ( resp ) =>
                                {
                                    console.error;
                                });
                            }
                        },
                        {
                            label: 'API 令牌',
                            accelerator: ( deps.bHotkeysEnabled === 1 || deps.store.getInt( 'bHotkeys' ) === 1 ) ? 'CTRL+T' : '',
                            click: function ()
                            {
                                deps.prompt(
                                    {
                                        title: '设置 API 令牌',
                                        label: `API 令牌\u003cdiv class="label-desc"\u003e请前往 ntfy.sh 或者自托管的实例中生成一个 API 令牌，以接收桌面通知。\u003c/div\u003e`,
                                        useHtmlLabel: true,
                                        value: deps.store.get( 'apiToken' ),
                                        alwaysOnTop: true,
                                        type: 'input',
                                        customStylesheet: path.join( app.getAppPath(), `pages`, `css`, `prompt.css` ),
                                        height: 290,
                                        icon: deps.appIcon,
                                        inputAttrs: {
                                            type: 'text'
                                        }
                                    },
                                    deps.guiMain
                                )
                                .then( ( resp ) =>
                                {
                                    if ( resp !== null )
                                        deps.store.set( 'apiToken', resp );
                                })
                                .catch( ( resp ) =>
                                {
                                    console.error;
                                });
                            }
                        },
                        {
                            label: '订阅主题',
                            accelerator: ( deps.bHotkeysEnabled === 1 || deps.store.getInt( 'bHotkeys' ) === 1 ) ? 'CTRL+SHIFT+T' : '',
                            click: function ()
                            {
                                deps.prompt(
                                    {
                                        title: '设置订阅的主题',
                                        label: `订阅主题<div class="label-desc">请指定希望接收桌面通知的主题列表，多个主题使用逗号分隔。<br><br>例如: ${ deps.defTopics }</div>`,
                                        useHtmlLabel: true,
                                        value: deps.store.getSanitized( 'topics', deps.defTopics ),
                                        alwaysOnTop: true,
                                        type: 'input',
                                        customStylesheet: path.join( app.getAppPath(), `pages`, `css`, `prompt.css` ),
                                        height: 310,
                                        icon: deps.appIcon,
                                        inputAttrs: {
                                            type: 'text'
                                        }
                                    },
                                    deps.guiMain
                                )
                                .then( ( resp ) =>
                                {
                                    if ( resp !== null )
                                    {
                                        /**
                                            don't update topics unless values differ from original, since we need to reload the page
                                        */

                                        if ( deps.store.get( 'topics' ) !== resp )
                                        {
                                            deps.store.set( 'topics', resp );

                                            if ( typeof ( deps.store.get( 'instanceURL' ) ) !== 'string' || deps.store.get( 'instanceURL' ) === '' || deps.store.get( 'instanceURL' ) === null )
                                                deps.store.set( 'instanceURL', deps.defInstanceUrl );

                                            deps.guiMain.loadURL( deps.store.get( 'instanceURL' ) );
                                        }
                                    }
                                })
                                .catch( ( resp ) =>
                                {
                                    console.error;
                                });
                            }
                        },
                {
                    label: '通知设置',
                    accelerator: ( deps.bHotkeysEnabled === 1 || deps.store.getInt( 'bHotkeys' ) === 1 ) ? 'CTRL+N' : '',
                    click: function ()
                    {
                        deps.prompt(
                            {
                                title: '通知设置',
                                label: `通知设置<div class="label-desc">决定通知的行为方式。</div>`,
                                useHtmlLabel: true,
                                alwaysOnTop: true,
                                type: 'multiInput',
                                resizable: false,
                                customStylesheet: path.join( app.getAppPath(), `pages`, `css`, `prompt.css` ),
                                height: 550,
                                icon: deps.appIcon,
                                multiInputOptions:
                                [
                                    {
                                        label: '常驻通知',
                                        description: '保持通知持续显示在桌面上，直到被手动关闭。',
                                        selectOptions: { 0: '禁用', 1: '启用' },
                                        value: deps.store.get( 'bPersistentNoti' )
                                    },
                                    {
                                        label: '日期格式',
                                        description: '决定日期和时间戳的显示格式。',
                                        value: deps.store.get( 'datetime' ) || deps.defDatetime,
                                        inputAttrs:
                                        {
                                            placeholder: `${ deps.defDatetime }`,
                                            required: true
                                        }
                                    },
                                    {
                                        label: '轮询频率',
                                        description: '轮询获取新通知数据间的时间间隔',
                                        value: deps.store.get( 'pollrate' ) || deps.defPollrate,
                                        inputAttrs: {
                                            type: 'number',
                                            required: true,
                                            min: 1,
                                            step: 1
                                        }
                                    }
                                ]
                            },
                            deps.guiMain
                        )
                        .then( ( resp ) =>
                        {
                            if ( resp !== null )
                            {
                                deps.store.set( 'bPersistentNoti', resp[ 0 ] );
                                deps.store.set( 'datetime', resp[ 1 ] );
                                let newPollrate = resp[ 2 ] || deps.defPollrate;
                                newPollrate = Math.max( deps.minPollrate, Math.min( deps.maxPollrate, newPollrate ) );
                                deps.store.set( 'pollrate', newPollrate );

                                /**
                                    restart polling with new interval
                                */

                                const fetchInterval = ( newPollrate * 1000 ) + 600;
                                if ( deps.pollInterval )
                                    clearInterval( deps.pollInterval );

                                deps.pollInterval = setInterval( deps.GetMessages, fetchInterval );

                                deps.Log.info( `core`, deps.chalk.yellow( `[polling]` ), deps.chalk.white( `:  ` ),
                                    deps.chalk.blueBright( `<msg>` ), deps.chalk.gray( `Updated polling interval` ),
                                    deps.chalk.blueBright( `<interval>` ), deps.chalk.gray( `${ fetchInterval }ms` ) );
                            }
                        })
                        .catch( ( resp ) =>
                        {
                            console.error;
                        });
                    }
                }
            ]
        },
        {
            type: 'separator'
        },
                {
            label: '退出',
            id: 'quit',
            accelerator: ( deps.bHotkeysEnabled === 1 || deps.store.getInt( 'bHotkeys' ) === 1 ) ? 'CTRL+Q' : '',
            click: function ()
            {
                deps.gracefulShutdown();
            }
        }
    ]
},
{
    label: '编辑',
    id: 'edit',
    submenu: [
        {
            label: '撤销',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
        },
        {
            label: '恢复',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
        },
        {
            type: 'separator'
        },
        {
            label: '剪切',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
        },
        {
            label: '复制',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        },
        {
            label: '粘贴',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        },
        {
            label: '全选',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall'
        }
    ]
},
{
    label: '视图',
    id: 'view',
    submenu: [
        {
            label: '返回',
            accelerator: 'CmdOrCtrl+B',
            click: function ( item, focusedWindow )
            {
                const { navigationHistory } = focusedWindow.webContents;
                if ( navigationHistory.canGoBack() )
                    navigationHistory.goBack();
            }
        },
        {
            label: '前进',
            accelerator: 'CmdOrCtrl+F',
            click: function ( item, focusedWindow )
            {
                const { navigationHistory } = focusedWindow.webContents;
                if ( navigationHistory.canGoForward() )
                    navigationHistory.goForward();
            }
        },
        {
            type: 'separator'
        },
        {
            label: '重新加载',
            accelerator: 'CmdOrCtrl+R',
            click: function ( item, focusedWindow )
            {
                if ( focusedWindow )
                    focusedWindow.reload();
            }
        },
        {
            label: '切换全屏',
            accelerator: ( function ()
            {
                if ( process.platform === 'darwin' )
                    return 'Ctrl+Command+F';
                else
                    return 'F11';
            })(),
            click: function ( item, focusedWindow )
            {
                if ( focusedWindow )
                focusedWindow.setFullScreen( !focusedWindow.isFullScreen() );
            }
        }
    ]
},
{
    label: '帮助',
    id: 'help',
    submenu: [
        {
            label: '发送测试通知',
            click()
            {
                deps.toasted.notify(
                {
                    title: `${ deps.appTitle } - 测试通知`,
                    subtitle: `${ deps.appVer }`,
                    message: `这是一条测试通知，用于检测 NtfyToast 和 toasted-notifier 是否在当前的系统上正常工作。如果你能看到这条通知，说明一切正常。`,
                    sound: 'Pop',
                    open: deps.store.get( 'instanceURL' ),
                    persistent: true,
                    sticky: true
                });
                deps.UpdateBadge( );
            }
        },
        {
            type: 'separator'
        },
        {
            label: '检查更新',
            click()
            {
                deps.shell.openExternal( `${ deps.packageJson.homepage }` );
            }
        },
        {
            label: '赞助',
            click()
            {
                deps.shell.openExternal( `https://buymeacoffee.com/aetherinox` );
            }
        },
        {
            id: 'about',
            label: '关于',
            click()
            {
                const aboutTitle = `关于`;
                const guiAbout = new BrowserWindow(
                {
                    width: 480,
                    height: 440,
                    title: `${ aboutTitle }`,
                    icon: deps.appIcon,
                    parent: deps.guiMain,
                    center: true,
                    resizable: false,
                    fullscreenable: false,
                    minimizable: false,
                    maximizable: false,
                    modal: true,
                    backgroundColor: '#212121',
                    webPreferences:
                    {
                        nodeIntegration: false,         // security: disable node integration
                        contextIsolation: true,         // security: enable context isolation
                        enableRemoteModule: false,      // security: disable remote module
                        sandbox: true,                  // security: enable sandbox for about window
                        webSecurity: true               // security: enable web security
                    }
                });

                guiAbout.loadFile( path.join( app.getAppPath(), `pages`, `about.html` ) ).then( () =>
                {
                    guiAbout.webContents
                        .executeJavaScript(
                            `
                    setTitle('${ aboutTitle }');
                    setAppInfo('${ deps.appRepo }', '${ deps.appTitle }', '${ deps.appVer }', '${ deps.appAuthor }', '${ deps.appElectron }');`,
                            true
                        )
                        .then( ( result ) => {})
                        .catch( console.error );
                });

                guiAbout.webContents.on( 'new-window', ( e, url ) =>
                {
                    e.preventDefault();
                    deps.shell.openExternal( url );
                });

                /**
                    remove menubar from about window
                */

                guiAbout.setMenu( null );
            }
        }
    ]
}
];

    return menuMain;
};

/**
    electron > tray context menu
*/

function newMenuContext()
{
    if ( !deps )
        throw new Error( 'Dependencies not set. Call setMenuDeps first' );

    /**
        return menu template
    */

    return Menu.buildFromTemplate( [
        {
            label: '显示主页面',
            click: function ()
            {
                deps.store.set( 'indicatorMessages', 0 );
                deps.app.badgeCount = 0;
                deps.guiMain.show();
            }
        },
        {
            label: '退出',
            click: function ()
            {
                deps.gracefulShutdown();
            }
        }
    ] );
}

/**
    export class

    @usage          import { newMenuMain, newMenuContext, setMenuDeps } from './Classes/Menu.js';
                    menuMain = newMenuMain();
                    contextMenu = newMenuContext();
                    const menuHeader = Menu.buildFromTemplate( menuMain );
*/

export { newMenuMain, newMenuContext, setMenuDeps };
