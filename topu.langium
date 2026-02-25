grammar Topu

entry Model:
    (Decorator)? (namespaces+=Namespace)*;

Decorator:
    "#[" param=Param "]";

Namespace:
    '@' name=Nsid '{' (records+=Record | objects+=Obj | functions+=Fn)* '}';

type Definition = Obj | Record;

Obj:
    (doc=STRING)? name=NameID "{" (properties+=Property ";")* "}";

Record:
    (doc=STRING)? 'record' name=NameID body=Declarations;

Declarations:
    '{' ((properties+=Property | refs+=LocalRef | objects+=Obj | atoms+=AtomDecl) ';')* '}';

Fn:
    (doc=STRING)? type=("subscribe" | "query" | "mutation") name=NameID props=Props ('->' | '=>') body=Declarations;

Property:
    (doc=STRING)? key=NameID (optional?='?')? ':' value=Union;

Props:
    '(' (props+=Property (',' props+=Property)*)? ')';

Params:
    '(' (params+=Param (',' params+=Param)*)? ')';

Param:
    key=NameID "=" value=(STRING | INT | Boolean | Slice);

Type:
    type=Builtin (props=Params)?;

Builtin returns string:
    'String' | 'Integer' | 'Boolean' | 'Blob' | 'DateTime' | 'Did' | 'Uri';

GlobalRef:
    nsid=Nsid ("#" view=NameID)?;

LocalRef:
    "#" ref=[Definition];

List:
    '[' (slice=Slice)? ']';

Atom:
    ":" atom=[AtomDecl];

AtomDecl:
    "atom" ":"? name=NameID ";";

UnionItem:
    Type | LocalRef | GlobalRef | Declarations | Atom | UnitUnion;

Union:
    forcedUnion?='|'? 
    types+=UnionItem 
    ('|' types+=UnionItem)* closedUnion?='||'? (array=List)?;

UnitUnion:
    '(' Union ')';

Slice:
    (min=INT '..' max=INT | min=INT '..' | '..' max=INT);

Nsid:
    segments+=NameID ('.' segments+=NameID)+;

Boolean:
    value?='True' | 'False';

NameID returns string:
    ID | 'record' | 'atom' | 'query' | 'mutation' | 'subscribe'
    | 'String' | 'Integer' | 'Boolean' | 'Blob' | 'DateTime' | 'Did' | 'Uri'
    | 'True' | 'False';


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
