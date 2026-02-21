grammar Topu

entry Model:
    (namespaces+=Namespace)*;

Namespace:
    '@' name=Nsid '{' (records+=Record | objects+=Obj | functions+=Fn)* '}';

type Definition = Obj | Record;

Obj:
    name=ID body=Declarations;

Record:
    'record' name=ID body=Declarations;

Declarations:
    '{' ((properties+=Property | refs+=Ref) ';')* '}';

Fn:
    type=("get" | "post") name=ID props=Props '->' body=Declarations;

Property:
    key=ID (optional?='?')? ':' value=(Type | Union | Ref);

Props:
    '(' (props+=Property (',' props+=Property)*)? ')';

Params:
    '(' (params+=Param (',' params+=Param)*)? ')';

Param:
    key=ID "=" value=(STRING | INT | Boolean | Slice);

Type:
    type=[Builtin:ID] (props=Params)? (array=List)?;

interface Builtin {
    name: string
}

Ref:
    "#" ref=[Definition] (array=List)?;

List:
    '[' (slice=Slice)? ']';

Union:
    types+=(Type | Ref) ('|' types+=(Type | Ref))*;

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
