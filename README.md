# topu

a NSID-less language for defining and managing atproto lexicons, with a type system, package manager, and code generation

## why NSIDless?

because typescript doesn't make you buy the name of your type to be able to use it! and because systems evolve and change over time, and domains get in and out of ownership. if the ecosystem settles on DNS for resolution, then lexicons will forever be victims to link rot.

and like, we are literally building a system for content-addressed content, with users owning the data, and big world platforms being able to access it, frankly I'm not sure how anyone landed on the current resolution system and thought it was reasonable.

we clearly need an npm for this.

### old lexicons will work

```
shim { post, like } from "app.bsky"
```

you can declare stuff from legacy lexicons super easy

## why a DSL

because lexicons will never be able to enforce constraints, especially across lexicons, in your editor, leaving all your problems for the runtime.

in addition, this opens up possibilities like warning developers about incompatibilities, generating migration scripts that gracefully handle "breaking" lexicon updates, and having more info to generate better clients with.

also way easier on the eyes.