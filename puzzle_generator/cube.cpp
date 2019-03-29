//#include <bits/stdc++.h>
#include <vector>
#include <algorithm>
#include <iostream>
#include <ctime>
#include <cstring>
#include <string>
#include <cstdlib>
#include <cstdio>
#include <omp.h>
#include <queue>
#include <fstream>
#include "json.hpp"
#define flag_exit 0

using namespace std;
using json = nlohmann::json;

typedef int Bitset;

struct Node {
    vector<Node*> edges;
    int c, r;
    int rest; // number of choices to be made
    int color;
    int idx;

    Node (int c=0, int r=0):c(c),r(r),rest(2),color(-1) {}
};

class Graph {
    public:
        Graph(char **inputs);
        void solveCube();
        void writeTxtFile();
        void writeJsonFile();
        void printResult();

    private:
        int  findRoot(int col, int &x);
        bool checkMatching(int col);
        bool mergeVertices(int col, int &u, int v);
        void buildGraph();
        void buildPres();
        void chooseOdds();
        void dfs(Bitset pre, int up, int &col, int row, Bitset next);
        void findMatching(int col, vector<int> &S);
        void findShortestPath();
        void printSolution();
        void readOdds(char *file);
        void setOdds();

        bool* vis_nexts; // vis_nexts[1<<K], check for uniqueness
        clock_t t_total, t_temp;
        long long t_bug, bug, sol;
        int spl; // shortest path length
        int N, K, C; // N: size, K: columns, C: colors
        int* h; // h[K], # of nodes in a column
        int* maze; // maze[K], feasible solution(without vertical connection)
        int** par; // par[K][K*K]
        int** color; // color[K][K*K];

        Node*** node; // node[K][K], node[col][row]
        Node*** grid;
        vector<int> que, nexts; // nexts: store unique connection patterns
        vector<int>** pres; // pres[K][1<<K];
        vector< pair<int, int> > odds;
};

// initialize
Graph::Graph(char **inputs): t_bug(0), bug(0), sol(0), t_total(0), t_temp(0), spl(1000) {

    N = atoi(inputs[2]);
    C = atoi(inputs[3]);

    if ( N<=0 || C<=0 ) {
        cout << "size and color must be positive integers." << endl;
        exit(1);
    }

    K = N*2;
    h = new int [K];
    for (int i = 0; i < K/2; i++) {
        h[i] = 2*i + 1;
        h[i + K/2] = K;
    }

    odds.clear();
    if (!strcmp(inputs[1], "-r")) { // random
        chooseOdds();
    }
    else if (!strcmp(inputs[1], "-i")) { // input file
        readOdds(inputs[4]);
    }
    else {
        cout << "invalid argument: " << inputs[1] << endl;
        exit(1);
    }

    vis_nexts = new bool [1<<K];
    maze  = new int  [K];
    par   = new int *[K];
    color = new int *[K];
    node  = new Node **[K];
    grid  = new Node **[K];
    pres  = new vector<int> *[K];

    for (int i = 0; i < K; i++) {
        par[i]   = new int [K*K];
        color[i] = new int [K*K];
        node[i]  = new Node *[K];
        grid[i]  = new Node *[K];
        pres[i]  = new vector<int> [1<<K];
    }

}

void Graph::buildGraph() {

    for (int i=0; i<K; i++) {
        for (int j=0; j<h[i]; j++) {
            node[i][j] = new Node(i,j);
            node[i][j]->idx = i*K+j;

            grid[i][j] = new Node(i,j);
            grid[i][j]->idx = i*K+j;
        }
    }

    for (int i=1; i<K; i++) {
        for (int j=0; j<h[i]/2; j++) {
            node[i-1][j]->edges.push_back(node[i][j]);
            node[i-1][ h[i-1]-1-j ]->edges.push_back(node[i][h[i]-1-j]);

            grid[i-1][j]->edges.push_back(grid[i][j]);
            grid[i][j]->edges.push_back(grid[i-1][j]);

            grid[ i-1 ][ h[i-1]-1-j ]->edges.push_back(grid[ i ][ h[i]-1-j ]);
            grid[ i ][ h[i]-1-j ]->edges.push_back(grid[ i-1 ][ h[i-1]-1-j ]);
        }
    }

    for (int i=0; i<K; i++) {
        for (int j=0; j<h[i]-1; j++) {
            node[i][j]->edges.push_back(node[i][j+1]);
            grid[i][j]->edges.push_back(grid[i][j+1]);
            grid[i][j+1]->edges.push_back(grid[i][j]);
        }
    }
}

// set startpoint and endpoint for each color
void Graph::chooseOdds() {

    for (int i=0; i<K; i++) {
        for (int j=0; j<h[i]; j++) {
            odds.push_back( {i,j} );
        }
    }

    srand(time(NULL));
    random_shuffle(odds.begin(),odds.end());
    odds.resize( C*2 );
}

void Graph::readOdds(char *file) {

    FILE *f = fopen(file, "r");
    int x, y;

    if (!f) {
        cout << "failed to open the file" << endl;
        exit(1);
    }

    //fscanf(f, "%d %d", &N, &C);
    while(!feof(f)) {
        fscanf(f, "%d %d", &x, &y);
        odds.push_back( {x,y} );
    }
    odds.resize(C*2);
}

void Graph::setOdds() {
    for (int i=0; i<(int)odds.size(); i++) {
        auto &p = odds[i];
        node[p.first][p.second]->rest = 1;
        node[p.first][p.second]->color = i/2;
    }
}

// enumerate connection patterns to the next column within a single column
void Graph::dfs(Bitset pre, int up, int& col, int row, Bitset next) {

    if (row == h[col]) {
        if ( !vis_nexts[next] ) {
            nexts.push_back(next);
            vis_nexts[next]=1;
        }
        pres[col][next].push_back(pre);
        return;
    }

    Node *u = node[col][row];
    up += (pre>>row)&1; // choices that have been made
    int rest = u->rest - up;
    if (rest<0) return; // error
    if (rest==0) {
        dfs(pre,0,col,row+1,next); // don't choose
    }
    else if (rest==1) {
        for (auto v:u->edges) {
            if ( v->c == u->c ) { // walk down
                dfs(pre,1,col,row+1,next);
            }
            else { // walk to next column
                dfs(pre,0,col,row+1, next | (1<<(v->r)) );
            }
        }
    }
    else { // rest==2
        dfs(pre,0,col,row+1,next); // don't choose
        for (int i=0; i<u->edges.size(); i++) {
            for (int j=i+1; j<u->edges.size(); j++) {
                Node *p = u->edges[i];
                Node *q = u->edges[j];
                int nextp = next;

                if ( p->c != u->c ) nextp |= 1<<(p->r);
                if ( q->c != u->c ) nextp |= 1<<(q->r);

                if ( p->c == u->c || q->c == u->c ) {
                    dfs(pre,1,col,row+1,nextp);
                }
                else {
                    dfs(pre,0,col,row+1,nextp);
                }
            }
        }
    }
}

// forward calculation of connection pattern by column
void Graph::buildPres() {
    que.clear();
    que.push_back(0);

    for (int col=0; col<K; col++) {
        // printf("col=%d |que|=%d\n",col,que.size());
        for (int pre:que) {
            vis_nexts[pre]=0;
        }
        for (int pre:que) {
            dfs(pre,0,col,0,0);
        }
        que.clear();
        swap(que,nexts);
    }
}

// find the root of disjoint set
int Graph::findRoot(int col, int& x) {
    if (par[col][x] == x) return x;
    return par[col][x] = findRoot(col,par[col][x]);
}

// merge two vertices to same color and same root
bool Graph::mergeVertices(int col, int& u, int v) {
    u = findRoot(col,u);
    v = findRoot(col,v);

    int &cu = color[col][u];
    int &cv = color[col][v];

    if ( cu!=-1 && cv!=-1 && cu!=cv ) {
        return 0;
    }
    else {
        cu = cv = max(cu,cv);
        par[col][v] = u;
        return 1;
    }
}

// check if all colors match together
bool Graph::checkMatching(int col) {
    if (col==K) {
        // initialization
        for (int i=0; i<K; i++) {
            for (int j=0; j<h[i]; j++) {
                int idx = K*i + j;
                par[ col-1 ][ idx ] = idx;
                color[ col-1 ][ idx ] = node[i][j]->color;
            }
        }
        return 1;
    }

    Bitset pre = maze[col-1];
    Bitset next = maze[col];
    Bitset vertical = 0;

    // set vertical(inter-row) connection
    for (int i=0; i<h[col]; i++) {
        int d = node[col][i]->rest;
        d = d&1;
        if ( (pre>>i)&1 ) d^=1;
        if ( ((vertical<<1)>>i)&1 ) d^=1;
        for (Node *p : node[col][i]->edges) {
            if ( p->c == col )continue;
            if ( (next>>(p->r))&1 ) d^=1;
        }
        vertical |= (d<<i);
    }

    // or use memcpy
    for (int i=0; i<K*K; i++) {
        par[col-1][i] = par[col][i];
        color[col-1][i] = color[col][i];
    }

    for (int i=0; i<h[col]; i++) if ( (vertical>>i)&1 ) {
        int idx = K*col+i;
        if ( !mergeVertices(col-1,idx,idx+1) ) {
            // merge two vertices in same column
            ++bug;
            return 0;
        }
    }

    for (int i=0; i<h[col-1]; i++) {
        for (Node *p : node[col-1][i]->edges) {
            if ( p->c != col ) continue; // p is at column (col-1)
            if ( (pre>>(p->r))&1 ) {
                int u = K*(col-1)+i;
                int v = K*(p->c)+p->r; // p->c = col
                if ( !mergeVertices(col-1,u,v) ) {
                    // merge two vertices in different column
                    ++bug;
                    return 0;
                }
            }
        }
    }
    return 1;
}

// find a solution
void Graph::findMatching(int col, vector<int>& S) {
    if (col==-1) { // success
        findShortestPath();
        #if flag_exit
            exit(0);
        #endif
        t_bug = bug;
        t_temp = clock();
        sol++;
        return;
    }

    for (int next:S) {
        maze[col] = next;
        if ( !checkMatching(col+1) ) continue;
        findMatching(col-1, pres[col][next]);
    }
}

void Graph::findShortestPath()
{
    int total_length = 0;
    queue<Node *> q;
    vector<bool> visit;
    vector<int> pred, dist; //predecessor, distance

    for (int i = 0; i < C; i++)
    {
        auto &o = odds[i*2], &e = odds[i*2+1];
        bool goal = false;

        pred.clear();
        pred.resize(K*K);
        dist.clear();
        dist.resize(K*K, 0);
        visit.clear();
        visit.resize(K*K, false);

        while(!q.empty()) q.pop();

        q.push(grid[o.first][o.second]);
        visit[o.first*K + o.second] = true;

        while(!q.empty() && !goal)
        {
            Node *ptr = q.front();
            q.pop();

            for (auto n: ptr->edges)
            {
                if (visit[n->idx] == false && color[0][findRoot(0,n->idx)] == i)
                {
                    visit[n->idx] = true;
                    dist[n->idx] = dist[ptr->idx] + 1;
                    pred[n->idx] = ptr->idx;
                    q.push(n);

                    if (n == grid[e.first][e.second])
                    {
                        total_length += dist[n->idx];
                        goal = true;
                        break;
                    }
                }
            }
        }
    }
    if (total_length < spl) spl = total_length;
    //cout << "total shortest length: " << total_length << endl;
}

void Graph::solveCube()
{
    buildGraph();
    setOdds();
    buildPres();
    // no bugs above
    t_total = t_temp = clock();
    findMatching(K-1,que);
    t_total = clock() - t_total;
}

void Graph::printSolution()
{
    printf("\n");
    for (int i=0; i<K; i++) {
        if (h[i]!=K) printf(" ");
        for (int j=0; j<(K-h[i])/2; j++) printf("  ");
        for (int j=0; j<h[i]; j++) {
            int idx = i*K+j;
            idx = findRoot(0,idx);
            if (color[0][idx]==-1) printf(". ");
            else printf("%d ", color[0][idx]);
        }
        puts("");
    }

    printf("\ntimer: %.5f secs.\n", ((float)(clock() - t_temp))/CLOCKS_PER_SEC);
    printf("error: %d\n", bug-t_bug);

    #if flag_exit
    cout << "pairs: ";
    for (int i=0; i<odds.size(); i+=2) {
        printf("(%d,%d)-(%d,%d)", odds[i].first, odds[i].second, odds[i+1].first, odds[i+1].second);
        if (i < odds.size()-2) cout << " ";
        else cout << endl;
    }
    #endif
}

void Graph::writeTxtFile()
{
    string filename = to_string(N) + "_" + to_string(C) + ".txt";
    FILE *f = fopen(filename.c_str(), "a");
    if (!f) exit(1);

    fprintf(f, "pairs: ");
    for (int i=0; i<odds.size(); i+=2) {
        fprintf(f, "(%d,%d)-(%d,%d)", odds[i].first, odds[i].second, odds[i+1].first, odds[i+1].second);
        if (i < odds.size()-2) fprintf(f, " ");
        else fprintf(f, "\n");
    }
    fprintf(f, "sols: %lld, errs: %lld, time: %.5fs, spl: %d\n", sol, bug, ((float)t_total)/CLOCKS_PER_SEC, spl);
    fclose(f);
}

void Graph::writeJsonFile()
{
    json j;
    j["size"] = N;
    j["color"] = C;
    j["solutions"] = sol;
    j["errors"] = bug;
    j["time"] = ((float)t_total)/CLOCKS_PER_SEC;
    j["spl"] = spl;
    j["pairs"] = odds;

    // extract solvable board
    if (sol)
    {
        json k;
        char c[10];
        sprintf(c, "%d.json", N);
        fstream sin(c, fstream::in);

        if (!sin.is_open()) exit(1);
        if (sin.peek() != EOF) sin >> k;
        sin.close();

        fstream sout(c, fstream::out|fstream::trunc);
        k[to_string(k.size())] = j;
        sout << k;
        sout.close();
    }
}

void Graph::printResult()
{
    cout << "\npairs: ";
    for (int i=0; i<odds.size(); i+=2) {
        printf("(%d,%d)-(%d,%d)", odds[i].first, odds[i].second, odds[i+1].first, odds[i+1].second);
        if (i < odds.size()-2) cout << " ";
        else cout << endl;
    }

    cout << "Number of solution: " << sol << endl;
    cout << "Number of errors: " << bug << endl;
    printf("Total time: %.5f secs.\n", ((float)t_total)/CLOCKS_PER_SEC);
}

int main(int argc, char *argv[]) {

    class Graph g(argv);
    g.solveCube();
    //g.writeTxtFile();
    g.writeJsonFile();
    g.printResult();

    return 0;
}
