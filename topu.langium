grammar Topu

entry Model:
    (Decorator)? (namespaces+=Namespace)*;

Decorator:
    "#[" Param "]";

Namespace:
    '@' name=Nsid '{' (records+=Record | objects+=Obj | functions+=Fn)* '}';

type Definition = Obj | Record;

Obj:
    (doc=STRING)? name=ID body=Declarations;

Record:
    (doc=STRING)? 'record' name=ID body=Declarations;

Declarations:
    '{' ((properties+=Property | refs+=LocalRef | objects+=Obj) ';')* '}';

Fn:
    (doc=STRING)? type=("get" | "post") name=ID props=Props ('->' | '=>') body=Declarations;

Property:
    (doc=STRING)? key=ID (optional?='?')? ':' value=Union;

Props:
    '(' (props+=Property (',' props+=Property)*)? ')';

Params:
    '(' (params+=Param (',' params+=Param)*)? ')';

Param:
    key=ID "=" value=(STRING | INT | Boolean | Slice);

Type:
    type=Builtin (props=Params)? (array=List)?;

Builtin returns string:
    'String' | 'Integer' | 'Boolean' | 'Blob' | 'DateTime' | 'Did' | 'Uri';

GlobalRef:
    nsid=Nsid ("#" view=ID)? (array=List)?;

LocalRef:
    "#" ref=[Definition] (array=List)?;

List:
    '[' (slice=Slice)? ']';

Union:
    types+=(Type | LocalRef | GlobalRef | Declarations) ('|' types+=(Type | LocalRef | GlobalRef | Declarations))*;

Slice:
    (min=INT '..' max=INT | min=INT '..' | '..' max=INT);

Nsid:
    segments+=ID ('.' segments+=ID)+;

Boolean:
    value?='True' | 'False';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
