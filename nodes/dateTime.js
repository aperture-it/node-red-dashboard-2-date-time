const { exec } = require('child_process');

module.exports = function (RED) {
    function dateTimeNode(config) {
        RED.nodes.createNode(this, config)

        const node = this
        const group = RED.nodes.getNode(config.group)
        const event = `msg-input:${node.id}`
        
        // only for test
        const isWindows = process.platform === 'win32'
        const p = isWindows?'"C:\\Program Files\\Git\\usr\\bin\\ssh.exe" aperture@192.168.1.2 "':''
        const s = isWindows?'"':''

        const evts = {
            onAction: true,
            onSocket: {
                'set-time': (conn, id, msg) => {
                    exec(`${p}sudo timedatectl set-time \'${msg.payload}\'${s}`, (err, stdout, stderr) => {
                        if (err) {
                            conn.emit(event, { error: err.message })
                            return;
                        }

                        conn.emit(event, { error: '' })

                        if (stderr)
                            conn.emit(event, { error: stderr })
                    });
                },
                'get-ntp': (conn, id, msg) => {
                    exec(`${p}timedatectl -p NTP show${s}`, (err, stdout, stderr) => {

                        if (err) {
                            conn.emit(event, { error: err.message })
                            return;
                        }
                        if (stdout.startsWith('NTP')) {
                            const ntp_state = stdout.split('=')[1].trim()
                            conn.emit(event, { ntp: ntp_state })
                        } else {
                            conn.emit(event, { ntp: '' })
                        }

                        if (stderr)
                            conn.emit(event, { error: stderr })
                    });
                },
                'set-ntp': (conn, id, msg) => {
                    exec(`${p}sudo timedatectl set-ntp ${msg.payload}${s}`, (err, stdout, stderr) => {
                        if (err) {
                            conn.emit(event, { error: err.message })
                            return;
                        }
                        if (stdout.length == 0) {
                            conn.emit(event, { ntp: msg.payload })
                        } else {
                            conn.emit(event, { error: stdout })
                        }

                        if (stderr)
                            conn.emit(event, { error: stderr })
                    });
                }
            }
        }

        if (group) {
            group.register(node, config, evts)
        } else {
            node.error('No group configured')
        }
    }

    RED.nodes.registerType('dateTime', dateTimeNode)
}