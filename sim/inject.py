import re,sys
src=open('sim/ai.js',encoding='utf-8').read()
src=src[:src.index("if(typeof module")].rstrip()
t=open('index.html',encoding='utf-8').read()
a=t.index('/*AI-BEGIN*/');b=t.index('/*AI-END*/')
t=t[:a]+'/*AI-BEGIN*/\n'+src+'\n'+t[b:]
open('index.html','w',encoding='utf-8').write(t)
print('injected',len(src))
